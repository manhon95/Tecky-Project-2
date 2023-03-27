import '../session-middleware';
import { getString, HttpError } from '../utils/express';
import express, { Request, Router } from 'express';
import { getSessionUser, hasLogin } from '../guard';


export let userRoutes = Router();

export type User = {
  id: number
  username: string
  password: string
  elo: number
}

let users: User[] = [
  { id: 1, username: 'ivan', password: 'ivan', elo: 1500 },
  { id: 2, username: 'trin', password: 'trin', elo: 2000 },
  { id: 2, username: 'admin', password: 'admin', elo: 3000 },
]

userRoutes.post('/login', (req, res) => {
  let username = getString(req, 'username')
  let password = getString(req, 'password')

  let user = users.find(user => user.username === username)
  if (!user) {
    throw new HttpError(403, 'wrong username')
  }

  if (user.password !== password) {
    throw new HttpError(403, 'wrong username or password')
  }

  req.session.user = { id: user.id, username }
  req.session.save();

  // should be redirecting to the game lobby page
  // res.end("login success")
  res.json({ success: true })
  // res.redirect('/user/lobby.html')
  // res.sendFile(path.resolve('protected', 'lobby.html'));

})

userRoutes.get('/username', hasLogin, (req, res) => {
  // console.log("having get role req")
  let username = getSessionUser(req).username
  res.json({
    username
  })
})

userRoutes.use('/user', hasLogin, express.static('protected'))




