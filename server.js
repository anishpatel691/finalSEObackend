// server.js
import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import { createServer } from "http";
import { MongoClient } from "mongodb";

// Load environment variables from .env file

const app = express();
app.use(express.json());  // Middleware to parse JSON data
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// MongoDB Connection
const uri =  "mongodb+srv://AnishPatel:patel69@cluster0.qcgkc.mongodb.net"; // MongoDB URI from .env
const client = new MongoClient(uri);
let messagesCollection;

// MongoDB connection with retry logic
const connectWithRetry = async () => {
  try {
    await client.connect();
    const db = client.db("chatApp"); // Database name
    messagesCollection = db.collection("messages"); // Collection name
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB, retrying in 5 seconds...");
    setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
  }
};

connectWithRetry();

// Apply CORS middleware to the Express app
app.use(cors());

// Home route
app.get("/", (req, res) => {
  res.send("Hello from the server!");
});

// WebSocket setup
io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.emit("welcome", `Welcome to the server`);

  socket.broadcast.emit("welcome", `${socket.id} joined the Socket server`);

  socket.on("message", async (data) => {
    console.log(data); // Logs the message data received
    const id = socket.id; // Logs the socket ID

    // Save the message to MongoDB
    try {
      const messageDocument = { message: data, socketId: id, timestamp: new Date() };
      await messagesCollection.insertOne(messageDocument);
      console.log("Message saved to MongoDB", messageDocument);
    } catch (error) {
      console.error("Failed to save message to MongoDB", error);
    }

    io.emit("receiveMsg", { data, id }); // Broadcast the message to all clients
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
  console.log("http://localhost:3000");
});
