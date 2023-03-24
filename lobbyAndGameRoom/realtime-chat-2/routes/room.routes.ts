import '../session-middleware';
import { getString, HttpError } from '../utils/express';
import express, { Request, Router } from 'express';
import { getSessionUser, hasLogin } from '../guard';
import { io } from '../server';

type Room = {
  id: number
  name: string
  owner: string
}

let rooms: Room[] = [];
let maxRoomId = rooms.reduce((id, item) => Math.max(id, item.id), 0)
export let roomRoutes = Router();

// handling room creation request
roomRoutes.post('/rooms', hasLogin, ((req, res) => {

  let roomName = getString(req, 'name')
  if (getSessionUser(req)) {
    let owner = getSessionUser(req).username;
    if (rooms.find(room => room.owner === owner) !== undefined) {
      throw new HttpError(400, 'Repeated room')
    }
    maxRoomId++;
    let room: Room = { id: maxRoomId, name: roomName, owner };
    rooms.push(room)
    res.json({ maxRoomId });
    io.emit('new-room', room);
  }
}))

// showing all room content 
roomRoutes.get('/rooms', (req, res) => {
  res.json({ rooms })
})