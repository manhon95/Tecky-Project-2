import { Request, Response } from "express";
import database from "./db";
import formidable from "formidable";
import fs from "fs";
import "./middleware";
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
  let oldImage = await database.query(
    'select profilePic from "user" where id = ($1)',
    [id]
  );
  const oldImageName = oldImage.rows[0].profilepic;

  res.json(oldImageName);
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
  let result = await database.query(
    /* sql */ `
SELECT active_badge_id 
FROM "user"
WHERE id = $1
  `,
    [userId]
  );
  let ownershipId = result.rows[0].active_badge_id;
  if (ownershipId !== null) {
    // console.log("have active");
    let badgeResult = await database.query(
      /* sql */ `
SELECT name, url
FROM "badge" b
WHERE b.id  = 
(select badge_id from "user_badge" ub WHERE ub.id = $1) 
    `,
      [ownershipId]
    );
    return badgeResult.rows;
  }
  return [];
}

async function updateActiveBadgeInDB(userId: number, badgeId: number) {
  let result = await database.query(
    /* sql */ `
UPDATE "user"
SET active_badge_id  = $2
WHERE id = $1
  `,
    [userId, badgeId]
  );
}
