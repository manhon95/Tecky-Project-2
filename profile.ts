import { Request, Response } from "express";
import database from "./db";
import formidable from "formidable";
import fs from "fs";
import "./middleware";
import dayjs from "dayjs";
import { sendEmailVerificationCode } from "./utils/sendEmailCode";
import { hashPassword } from "./utils/hash";
/* ------------------------ function for Router handler ----------------------- */

export async function patchUsername(req: Request, res: Response) {
  updateUsernameInDB(+req.params.id, req.body.newName);
  res.json({});
}

export async function getUserBadges(req: Request, res: Response) {
  let badges = await readUserBadgesFromDB(+req.params.userId);
  res.json(badges);
}

export async function getUserActiveBadge(req: Request, res: Response) {
  let active = await readUserActiveBadgeFromDB(+req.params.userId);
  res.json(active);
}
export async function patchUserActiveBadge(req: Request, res: Response) {
  await updateActiveBadgeInDB(+req.params.userId, +req.params.badgeId);
  res.json({});
}
export async function deleteUserActiveBadge(req: Request, res: Response) {
  // delete = set null
  // await updateActiveBadgeInDB(+req.params.userId, null);
  res.json({});
}
export async function getMatchHistory(req: Request, res: Response) {
  let winRate, gameWon;
  const userId = +req.params.userId;

  let history = await readMatchHistoryFromDB(userId);
  let gamePlayed = history.length;
  history.map((match) => {
    match.match_date = dayjs(match.match_date).format("|DD/MM| HH:mm");
  });
  if (gamePlayed != 0) {
    gameWon = history.reduce((acc, curr) => {
      // console.log(`checking ${curr.winner_id == userId}`);
      return acc + (curr.winner_id == userId ? 1 : 0);
    }, 0);
    winRate = +((gameWon / history.length) * 100).toFixed(1);
  } else {
    winRate = 0; // -1 means no match played
    gameWon = 0;
  }

  // console.log({ gameWon, winRate });
  res.json({ winRate, gameWon, history, gamePlayed });
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

const uploadDir = "protected/assets/profilePicture";
fs.mkdirSync(uploadDir, { recursive: true });
const form = formidable({
  uploadDir,
  keepExtensions: true,
  filter: (part) => part.mimetype?.startsWith("image/") || false,
});

export async function upLoadProfilePicture(req: Request, res: Response) {
  let id = req.session.user?.id;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(507);
      res.json({ err: "fail to up load image", detail: String(err) });
      return;
    }
    let profilePic = files.profilePic;
    if (profilePic == undefined) {
      res.end();
      return;
    }
    let newProfilePic = Array.isArray(profilePic) ? profilePic[0] : profilePic;
    let oldImage = await database.query(
      'select profilePic from "user" where id = ($1)',
      [id]
    );
    const oldImageName = oldImage.rows[0].profilepic;
    database.query(
      /*sql*/ `update "user" set profilepic = '${newProfilePic.newFilename}' where id = ${id}`
    );
    if (fs.existsSync(`protected/assets/profilePicture/${oldImageName}`)) {
      fs.unlink(`protected/assets/profilePicture/${oldImageName}`, (err) => {
        if (err) throw err;
      });
    }
    res.json(newProfilePic.newFilename);
  });
}

export async function getProfilePicture(req: Request, res: Response) {
  let id = req.session.user?.id;
  const userInfo = {};
  let oldImage = await database.query(
    'select profilePic, user_name from "user" where id = ($1)',
    [id]
  );
  userInfo["oldImageName"] = oldImage.rows[0].profilepic;
  userInfo["userName"] = oldImage.rows[0].user_name;
  res.json(userInfo);
}

async function readUserBadgesFromDB(userId: number) {
  let result = await database.query(
    /* sql */ `
SELECT b.id as id,
  b.name as name,
  b.url as url
FROM user_badge ub
  JOIN badge b ON ub.badge_id = b.id
WHERE ub.owner_id = $1;
  `,
    [userId]
  );
  return result.rows;
}

async function readUserActiveBadgeFromDB(userId: number) {
  // find active badge id first
  let result = await database.query(
    /* sql */ `
SELECT active_badge_id 
FROM "user"
WHERE id = $1
  `,
    [userId]
  );
  // return relevant badge from DB
  let activeBadgeId = result.rows[0].active_badge_id;
  if (activeBadgeId !== null) {
    // console.log("have active");
    let badgeResult = await database.query(
      /* sql */ `
SELECT name, url
FROM "badge" b
WHERE b.id  = $1
    `,
      [activeBadgeId]
    );
    return badgeResult.rows;
  }
  return [];
}

async function updateActiveBadgeInDB(userId: number, badgeId: number | null) {
  let result = await database.query(
    /* sql */ `
UPDATE "user"
SET active_badge_id  = $2
WHERE id = $1
  `,
    [userId, badgeId == -1 ? null : badgeId]
  );
}

async function readMatchHistoryFromDB(userId: number) {
  let result = await database.query(
    /* sql */ `
SELECT m.id AS match_id,
    m.match_name,
    m.match_date,
    u.user_name AS winner,
    u.id AS winner_id,
    string_agg(u2.user_name, ', ') AS participants
FROM user_match AS um
  JOIN match AS m ON um.match_id = m.id -- uId16'match
  JOIN "user" AS u ON m.winner_id = u.id-- join 
  JOIN user_match AS um2 ON m.id = um2.match_id
  JOIN "user" AS u2 ON um2.player_id = u2.id
WHERE um.player_id = $1
GROUP BY m.id, m.match_name, m.match_date, u.id, u.user_name;
`,
    [userId]
  );
  return result.rows;
}

export async function getPasswordVerifyCode(req: Request, res: Response) {
  let result = await database.query('select email from "user" where id=($1);', [
    req.session.user?.id,
  ]);
  let verificationCode = await sendEmailVerificationCode(result.rows[0].email);
  req.session.verificationCode = verificationCode;
  res.end();
}

export async function submitVerifyCode(req: Request, res: Response) {
  if (req.session.verificationCode == req.body.code) {
    res.json({ pass: true });
  } else {
    res.json({ message: "invalid code", pass: false });
  }
}

export async function changeNewPassword(req: Request, res: Response) {
  let password = req.body.password;
  let ConfirmPassword = req.body.ConfirmPassword;
  if (password == ConfirmPassword) {
    const hasdedPassword = await hashPassword(password);
    database.query(
      `update "user" set password = '${hasdedPassword}' where id = ${req.session.user?.id}`
    );
    res.json({ message: "set new password success" });
  } else {
    res.json({ message: "set new password fail" });
  }
}
