import React from "react";
import io from "socket.io-client";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const socket = io(backendUrl);
const chat = () => {

  socket.on("connect", () => {
    console.log("Connected to server");
  });

  return <div></div>;
};

export default chat;
