import database from "../db";
import { Request, Response } from "express";
import "../middleware";

export async function findAccount(req: Request, res: Response) {
  try {
    const result = await database.query(
            /* sql */ `select id, email, user_name, elo, coins, email_verify from "user" where email like $1`,

      // /* sql */ `select id, email, user_name, elo, coins, email_verify from "user" where email=($1)`,
      [`%${req.body.email}%`]
    );
console.log(result)
    let account = {
      id: result.rows[0].id,
      userName: result.rows[0].user_name,
      email: result.rows[0].email,
      coins: result.rows[0].coins,
      elo: result.rows[0].elo,
      emailVerification: result.rows[0].email_verify,
    };
    console.log(account);
    res.json(result.rows);
  } catch {
    res.json({ message: "No email found" });
  }
}

export async function changCoinsAmount(req: Request, res: Response) {
  try {
    let beforeCoinsAmount = await database.query(
      /* sql */ `select coins from "user" where email=($1)`,
      [req.body.email]
    );

    await database.query(
      /* sql */ `update "user" set coins = coins + $1 where email = $2 `,
      [req.body.coins, req.body.email]
    );

    const result = await database.query(
      /* sql */ `select id, email, user_name, elo, coins,email_verify from "user" where email=($1)`,
      [req.body.email]
    );

    console.log(result.rows[0].id);
    let account = {
      id: result.rows[0].id,
      userName: result.rows[0].user_name,
      email: result.rows[0].email,
      coins: result.rows[0].coins,
      elo: result.rows[0].elo,
      emailVerification: result.rows[0].email_verify,
      message: `user ID: ${result.rows[0].id} coins has been changed from ${beforeCoinsAmount.rows[0].coins} to ${result.rows[0].coins}`,
    };
    res.json(account);
  } catch (e) {
    console.log(e);
    res.json({ message: e });
  }
}

export async function verification(req: Request, res: Response) {
  try {
    const result = await database.query(
      /* sql */ `select id, email, user_name, elo, coins,email_verify from "user" where email= $1`,
      [req.body.email]);
    await database.query(
      /* sql */ `update "user" set email_verify = $1 where email = $2 `,
      [req.body.verification, req.body.email]
    );

    let account = {
      id: result.rows[0].id,
      userName: result.rows[0].user_name,
      email: result.rows[0].email,
      coins: result.rows[0].coins,
      elo: result.rows[0].elo,
      emailVerification: req.body.verification,
      message: `user ID: ${result.rows[0].id} email verification has been changed from ${result.rows[0].email_verify} to ${req.body.verification}`,
    };
    res.json(account);
  } catch {
    res.json({ message: "No email found" });
  }
}
