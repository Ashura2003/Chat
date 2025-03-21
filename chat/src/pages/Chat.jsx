import React from "react";
import io from "socket.io-client";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const socket = io(backendUrl);
const chat = () => {
  return <div></div>;
};

export default chat;
