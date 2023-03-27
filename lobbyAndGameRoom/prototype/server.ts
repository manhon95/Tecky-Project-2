import express, { json, NextFunction, Request, Response, urlencoded } from 'express'

import path from 'path';
import http from 'http';
import { print } from 'listening-on';
import { sessionMiddleware } from './session-middleware';
<<<<<<< HEAD

import { formatMessage } from '../../utils/messages';
import { getCurrentPlayer, getRoomPlayers, playerJoin, playerLeave } from '../../utils/players';
=======
import { initSocketServer } from './socketIOManager';
import { createRoomRoutes } from './routes/room.routes';
import { userRoutes } from './routes/user.routes';
>>>>>>> 55cbb7ba6c89a153ddfc9cc2912def97e723e015



let app = express()
<<<<<<< HEAD
let server = http.createServer(app)
export let io = new socketIO.Server(server)
import { userRoutes } from '../../routes/user.routes';
import { rooms, roomRoutes } from '../../routes/room.routes';
=======
let server = http.createServer(app);
>>>>>>> 55cbb7ba6c89a153ddfc9cc2912def97e723e015

// Initialize Socket.IO server
let io = initSocketServer(app, server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// decode middleware
app.use(urlencoded());
app.use(json());
app.use(sessionMiddleware)


// other resources routing
app.use(userRoutes)
app.use(createRoomRoutes(io))


// Report route not found
app.use((req, res, next) => {
  res.status(404)
  res.json({ error: 'Route not found' })
})



// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if ('statusCode' in error) {
    res.status(error.statusCode)
  } else {
    res.status(500)
  }
  let message = String(error)
  message = message.replace(/\w+: /, '')
  res.json({
    error: message,
  })
})

// Response general 404 error
app.use((req, res) => {
  res.status(404);
  res.json({ error: 'route not found' });
})
const PORT = 8100;

server.listen(PORT, () => {
  print(PORT)
});