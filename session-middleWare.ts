import session = require("express-session");


export let sessionMiddleWare = session({
    secret: Math.random().toString(36),
    resave: false,
    saveUninitialized: false,
  });
declare module "express-session" {
  interface SessionData {
    
          user: {id: number,firstName: string}
  }
}
