// Package imports
const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const { disconnect } = require("process");
const connectDB = require("./database/databaseConfig");

// Cors Configuration
app.use(cors());

// Dotenv Configuration
dotenv.config();

// Server Configuration
const server = http.createServer(app);

// Connect to the database
connectDB();

// socket.io configuration
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("chat_message", (data) => {
    console.log(data);
    io.emit("chat_message", data);
  });
  socket.on("join_room", (room) => {
    socket.join = room;
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
  });
  socket.on(disconnect, () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Routes
app.use("/api/user", require("./routes/userRoutes"));

// Port Configuration
const PORT = process.env.PORT;

// Server listening
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
