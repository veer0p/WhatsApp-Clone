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

app.get("/chats/search", async (req, res) => {
  const query = req.query.q; // Search query string
  const startDateString = req.query.startDate; // Start date in string format (YYYY-MM-DD)

  try {
    // Validate startDateString format
    if (startDateString && !/^\d{4}-\d{2}-\d{2}$/.test(startDateString)) {
      return res
        .status(400)
        .json({ error: "Invalid startDate format. Use YYYY-MM-DD." });
    }

    // Build match conditions
    const matchConditions = {};
    if (startDateString) {
      matchConditions.date = { $gte: startDateString, $lte: startDateString };
    }
    if (query) {
      matchConditions["messages.content"] = { $regex: query, $options: "i" }; // Case-insensitive search
    }

    // Fetch data from the database
    const pipeline = [
      { $unwind: "$messages" }, // Flatten messages array
      { $match: matchConditions }, // Apply match conditions
      {
        $project: {
          _id: 1, // Include `_id` for message IDs
          date: 1,
          sender: "$messages.sender",
          content: "$messages.content",
          time: "$messages.time",
        },
      },
      { $sort: { _id: 1 } }, // Sort by `_id` in ascending order for proper pagination
    ];

    const results = await Message.aggregate(pipeline);

    // Determine `lastLoadedMessageId` and `firstLoadedMessageId`
    const lastLoadedMessageId =
      results.length > 0 ? results[results.length - 1]._id.toString() : null;
    const firstLoadedMessageId =
      results.length > 0 ? results[0]._id.toString() : null;

    // Group results by date for better formatting
    const groupedResults = results.reduce((acc, message) => {
      const date = message.date; // Use string date directly
      if (!acc[date]) acc[date] = [];
      acc[date].push({
        sender: message.sender,
        content: query
          ? message.content.replace(
              new RegExp(query, "ig"),
              (match) => `<mark>${match}</mark>`
            ) // Highlight matched query
          : message.content,
        time: message.time,
        highlighted: !!query,
      });
      return acc;
    }, {});

    // Format the final response
    const response = {
      total_matches: results.length,
      chats: Object.entries(groupedResults).map(([date, messages]) => ({
        date,
        messages: messages.sort((a, b) => a.time.localeCompare(b.time)),
      })),
      lastLoadedMessageId,
      firstLoadedMessageId,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in /chats/search API:", error);
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

app.get("/", (req, res) => {
  res.send("Hello, server is live!");
});

// Start the server

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
