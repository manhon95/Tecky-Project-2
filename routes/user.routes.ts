import "../session-middleware";
import { getString, HttpError } from "../utils/express";
import express, { Request, Router } from "express";
import { getSessionUser, hasLogin, isLoggedIn } from "../guard";
import { login } from "../LoginAuthenticate";
import { client } from "../db";
import dayjs from "dayjs";
import session from "express-session";

export let userRoutes = Router();

export type User = {
  id: number;
  username: string;
  password: string;
  elo: number;
};

userRoutes.post("/login/password", login);

//Log out function
userRoutes.post("/login/logout", (req, res)=>{
  console.log("here")
  if (req.session.user){
    console.log("save")
req.session.user.id = null;
req.session.user.username = "";
req.session.save()
console.log(req.session.user)
res.end()
  }
});

//use google to log in
userRoutes.get("/login/google", async (req, res, next)=>{
  try{
    let accessToken = req.session?.grant?.response?.access_token
    let raw = req.session?.grant?.response?.raw;
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo',{
      method:"get",
      headers:{
          "Authorization":`Bearer ${accessToken}`
        } 
      })
    let googleJson = await googleRes.json()
    console.log(googleJson)
    let resultDB = await client.query(
      'select id, user_name from "user" where email =($1)', [googleJson.email]
    )
    let user = resultDB.rows[0]
    if(user){
      //if existing user
      req.session.user = {id: user.id, username: user.user_name||googleJson.name}
      req.session.save()
      res.redirect('/user/gameroom')
      return
    }

  await client.query(
    `insert into "user" (user_name, email, elo) values ($1, $2, '1000')`, [googleJson.name, googleJson.email]
  )
  let id = await client.query(
    'select id, user_name from "user" where email =($1)', [googleJson.email]
  )
  console.log()
req.session.user = {id: id.rows[0].id, username: googleJson.name}
req.session.save()
  res.redirect('/user/gameroom')
  }catch(error){
  next(error)
  }
})

userRoutes.get("/username", hasLogin, async (req, res) => {
  // console.log("having get role req")
  if (req.session.user){
  let username = await getUsernameFromDB(req.session.user.id);
  res.json({
    username,
  });
}
});

// return user-id stored in the session data(back-end)
userRoutes.get("/user-id", hasLogin, async (req, res) => {
  let id = req.session.user?.id;
  if (id === undefined) {
    res.json({ error: "id not exist" });
    return;
  }
  res.json({ id });
});

// Restful API profile handler
userRoutes.get("/profiles/:id", async (req, res) => {
  const userId = +req.params.id;
  let result = await getInfoFromDB(userId);
  result.birthday = dayjs(result.birthday).format("DD/MM/YYYY");
  // console.log(result);
  // change the date format

  res.json(result);
});

// change username
userRoutes.patch("/usernames/:id", async (req, res) => {
  let newName = req.body.newName;
  let id = req.params.id;
  // check duplicate
  console.log("before check duplicate");
  let result = await client.query(
    /* sql */ `
select user_name from "user" where user_name = $1
`,
    [newName]
  );
  let row = result.rows[0];
  if (!row) {
    // if no existing same name
    await client.query(
      /*sql*/ `
update "user" set user_name = $1 where id = ${id}
    `,
      [newName]
    );
    res.json({ success: true });
    return;
  }
  res.json({ success: false });
});

async function getInfoFromDB(id: number | undefined) {
  if (id === undefined) return "error, id not exist";
  let result = await client.query(
    /*sql*/ `
select id, user_name, birthday, elo from "user" where id= $1
  `,
    [id]
  );
  return result.rows[0];
}

async function getUsernameFromDB(id: number | null) {
  if (id === undefined) return "error, id not exist";
  let result = await client.query(
    /*sql*/ `
select user_name from "user" where id= $1
  `,
    [id]
  );
  return result.rows[0].user_name;
}
