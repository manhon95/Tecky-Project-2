import '../session-middleWare';
import { getString, HttpError } from '../utils/express';
import { Router } from 'express';
import { isLoggedIn } from '../guard';
import { io } from '../main';

type Room = {
  id: number
  name: string
  owner: string
  count: number
}

export let rooms: Room[] = [];
let maxRoomId = rooms.reduce((id, item) => Math.max(id, item.id), 0)
export const roomCapacity = 6;
export let roomRoutes = Router();

// handling room creation request
roomRoutes.post('/rooms', isLoggedIn, ((req, res) => {
  let roomName = getString(req, 'name')
  if (req.session.user) {
    let owner = req.session.user?.firstName;
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