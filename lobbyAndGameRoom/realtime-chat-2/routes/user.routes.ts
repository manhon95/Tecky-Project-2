import '../session-middleware';
import { getString, HttpError } from '../utils/express';
import { Request, Router } from 'express';

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

  req.session.user = {
    id: user.id,
    username,
  }
  // should be redirecting to the game lobby page
  res.redirect('/temp.html')
})

userRoutes.get('/role', (req, res) => {
  console.log("having get role req")
  res.json({
    user: req.session.user,
  })
})
