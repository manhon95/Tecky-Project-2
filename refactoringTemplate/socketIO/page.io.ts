import socket from "socket.io";
import express from "express";

export function addPageSocketInitEvent(io: socket.Server) {
  io.on("connection", (socket) => {
    const req = socket.request as express.Request;

    socket.on("ask{Page}Init", (anyArgIfNeeded) => {
      //put all server logic here when the Page is loaded
      addPageSocketEvent(socket); //remain socket event is added when Page is Load
    });
  });
}

function addPageSocketEvent(socket: socket.Socket) {
  socket.on("{Page}SomeEvent1", (anyArgIfNeeded) => {});
  socket.on("{Page}SomeEvent1", (anyArgIfNeeded) => {});
  socket.on("{Page}SomeEvent1", (anyArgIfNeeded) => {});
}
