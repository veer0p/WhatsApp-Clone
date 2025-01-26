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
  const { lastMessageId, direction } = req.query; // Direction can be 'newer' or 'older'

  try {
    const query = {};

    // Set the limit to 30 for the initial fetch
    const limit = 1;

    // Determine the sort order based on the direction
    const sortOrder = direction === "older" ? -1 : 1; // Descending for 'older', Ascending for 'newer'

    // Add condition for pagination based on lastMessageId
    if (lastMessageId) {
      query._id =
        direction === "older"
          ? { $lt: lastMessageId } // Load chats with _id less than lastMessageId
          : { $gt: lastMessageId }; // Load chats with _id greater than lastMessageId
    }

    // Fetch chats sorted by _id and limited to 30 results
    const chats = await Message.find(query)
      .sort({ _id: sortOrder })
      .limit(limit);

    // Transform chats into the desired format
    const response = {
      chats: chats.map((chat) => ({
        date: chat.date,
        messages: chat.messages.map((msg) => ({
          time: msg.time,
          sender: msg.sender,
          content: msg.content,
          highlighted: false,
        })),
      })),
      lastLoadedMessageId: chats.length ? chats[chats.length - 1]._id : null, // Track the last loaded message ID for pagination
      firstLoadedMessageId: chats.length ? chats[0]._id : null, // Track the first loaded message ID for pagination
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
