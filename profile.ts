import { Request, Response } from "express";
import database from "./db";
/* ------------------------ function for Router handler ----------------------- */

export async function patchUsername(req: Request, res: Response) {
  updateUsernameInDB(+req.params.id, req.body.newName);
  res.json({});
}

/* ----------------------- function for Database query ---------------------- */
async function updateUsernameInDB(id: number, newName: string) {
  let result = await database.query(
    /* sql */ `
  select user_name from "user" where user_name = $1
  `,
    [newName]
  );
  let row = result.rows[0];
  if (!row) {
    // if no existing same name
    await database.query(
      /*sql*/ `
  update "user" set user_name = $1 where id = ${id}
    `,
      [newName]
    );
  }
  return true;
}
