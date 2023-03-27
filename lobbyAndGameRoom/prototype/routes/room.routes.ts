import '../lobbyAndGameRoom/prototype/session-middleware';
import { getString, HttpError } from '../utils/express';
import express, { Request, Router } from 'express';
<<<<<<< HEAD
import { getSessionUser, hasLogin } from '../lobbyAndGameRoom/prototype/guard';
import { io } from '../lobbyAndGameRoom/prototype/server';
=======
import { getSessionUser, hasLogin } from '../guard';
import socketIO from 'socket.io';
>>>>>>> 55cbb7ba6c89a153ddfc9cc2912def97e723e015

type Room = {
  id: number
  name: string
  owner: string
  count: number
}
// Make the rooms global such that the socketIO manager can get them
export let rooms: Room[] = [];

export function createRoomRoutes(io: socketIO.Server) {

  let roomRoutes = Router();


  let maxRoomId = rooms.reduce((id, item) => Math.max(id, item.id), 0)
  const roomCapacity = 2;


  // handling room creation request --> emit & create new room
  roomRoutes.post('/rooms', hasLogin, ((req, res) => {
    let roomName = getString(req, 'name')
    if (getSessionUser(req)) {
      let owner = getSessionUser(req).username;
      if (rooms.find(room => room.owner === owner) !== undefined) {
        throw new HttpError(400, 'You already own a room')
      }

      let room: Room = { id: maxRoomId, name: roomName, owner, count: 0 };
      rooms.push(room)
      res.json({ maxRoomId });
      maxRoomId++;
      io.emit('new-room', room);
    }
  }))


  roomRoutes.get('/user/chat.html', (req, res) => {
    console.log(req.query.username, req.query.room);
    res.json({});
  })
  // showing all room content 
  roomRoutes.get('/rooms', (req, res) => {
    res.json({ rooms })
  })

  // getting room max capacity 
  roomRoutes.get('/capacity', (req, res) => {
    res.json({ roomCapacity });
  })

  return roomRoutes;
}
