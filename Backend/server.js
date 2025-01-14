const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = 3000;

// MongoDB Atlas connection
const MONGO_URI =
  "mongodb+srv://veer:%40Veer.idk@whatsapp.3bc95.mongodb.net/Chats";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

// Define the message schema and model
const messageSchema = new mongoose.Schema(
  {
    date: { type: Date, index: true }, // Index the date field
    conversation_id: Number,
    messages: [
      {
        time: String,
        sender: String,
        content: String,
        status: String,
      },
    ],
  },
  { collection: "Bn" }
);

const Message = mongoose.model("Message", messageSchema);

// Middleware to parse JSON requestsN
app.use(express.json());
app.use(cors()); // Enable CORS for frontend requests

// **Search API**
app.get("/chats/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Search query (q) is required" });
  }

  const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

  try {
    const exactMatchRegex = `\\b${query}\\b`; // Exact match regex
    const partialMatchRegex = query; // Partial match regex

    const pipeline = [
      { $unwind: "$messages" },
      {
        $match: {
          $or: [
            { "messages.content": { $regex: exactMatchRegex, $options: "i" } },
            {
              "messages.content": { $regex: partialMatchRegex, $options: "i" },
            },
          ],
          ...(startDate && endDate
            ? { date: { $gte: startDate, $lte: endDate } }
            : {}),
        },
      },
      {
        $project: {
          _id: 0,
          date: 1,
          sender: "$messages.sender",
          content: "$messages.content",
          time: "$messages.time",
        },
      },
      { $sort: { date: -1 } },
    ];

    const results = await Message.aggregate(pipeline);

    // Format and group results in a single step
    const groupedResults = results.reduce((acc, message) => {
      const date = new Date(message.date).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push({
        sender: message.sender,
        content: message.content.replace(
          new RegExp(query, "ig"),
          (match) => `<mark>${match}</mark>`
        ),
        time: message.time,
        highlighted: true,
      });
      return acc;
    }, {});

    const response = {
      total_matches: results.length,
      chats: Object.entries(groupedResults).map(([date, messages]) => ({
        date,
        messages: messages.sort((a, b) => a.time.localeCompare(b.time)),
      })),
    };

    res.json(response);
  } catch (error) {
    console.error("Error performing search:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/chats", async (req, res) => {
  const { lastTimestamp, firstTimestamp } = req.query;

  try {
    const query = {};

    if (lastTimestamp) {
      query["messages.time"] = { $lt: new Date(lastTimestamp) }; // Fetch newer messages
    } else if (firstTimestamp) {
      query["messages.time"] = { $gt: new Date(firstTimestamp) }; // Fetch older messages
    }

    const chats = await Message.find(query).sort({ date: -1 }).limit(30);

    const allMessages = chats.flatMap((chat) => {
      chat.messages.sort((a, b) => b.time.localeCompare(a.time));
      return chat.messages.map((msg) => ({
        date: chat.date.toISOString().split("T")[0],
        sender: msg.sender,
        content: msg.content,
        time: msg.time,
        highlighted: false,
      }));
    });

    allMessages.sort((a, b) => b.time.localeCompare(a.time));

    const latestChats = allMessages.slice(0, 30);

    const groupedChats = latestChats.reduce((acc, message) => {
      if (!acc[message.date]) {
        acc[message.date] = [];
      }
      acc[message.date].push(message);
      return acc;
    }, {});

    const response = {
      chats: Object.entries(groupedChats).map(([date, messages]) => ({
        date,
        messages: messages.sort((a, b) => a.time.localeCompare(b.time)),
      })),
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
