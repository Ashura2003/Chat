import React from "react";
import io from "socket.io-client";
import "./App.css";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const socket = io(backendUrl);

const App = () => {
  const sendMessage = () => {
    socket.emit("chat_message", { message: "Hello World!" });
  };

  return (
    <div className="App">
      <input type="text" placeholder="message" />
      <button onClick={sendMessage}>Send Message</button>
    </div>
  );
};

export default App;
