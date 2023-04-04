import database from "../db";
import { Request, Response } from "express";
import dayjs from "dayjs";
import "../middleware";

export function onlineCount() {
  let onlineCount = 0;
  return {
    add() {
      onlineCount++;
    },
    deduct() {
      onlineCount--;
    },
    get() {
      return onlineCount;
    },
  };
}
/* ------------------------------ route handler ----------------------------- */
export async function getUsername(req: Request, res: Response) {
  res.json({
    username: await readUsernameFromDB(+req.params.id),
  });
}

export async function getSessionUserId(req: Request, res: Response) {
  let id = req.session.user?.id;
  if (id === undefined) {
    res.json({ error: "id not exist" });
    return;
  }
  res.json({ id });
}

export async function getProfile(req: Request, res: Response) {
  const userId = +req.params.id;
  let profile = await readProfileFromDB(userId);
  let profilePic = await getProfilePic(req.params.id);
  profile.birthday = dayjs(profile.birthday).format("DD/MM/YYYY");
  // console.log(result);
  // change the date format
  let profilePicUrl = profilePic.rows[0].profilepic;
  res.json({ profile, profilePicUrl });
}

/* ---------------------------- database function --------------------------- */
export async function getProfilePic(id: string) {
  let result = await database.query(
    /*sql*/ `
select profilepic from "user" where id = ($1)
`,
    [id]
  );
  return result;
}

export async function readProfileFromDB(id: number) {
  if (id === undefined) return "error, id not exist";
  let result = await database.query(
    /*sql*/ `
select id, user_name, birthday, elo from "user" where id= $1
  `,
    [id]
  );
  return result.rows[0];
}

export async function readUsernameFromDB(id: number) {
  // console.log("get username");
  if (id === undefined) return "error, id not exist";
  let result = await database.query(
    /*sql*/ `
select user_name from "user" where id= $1
  `,
    [id]
  );
  return result.rows[0].user_name;
}
