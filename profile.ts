import { Request, Response } from "express";
import database from "./db";
import formidable from "formidable";
import fs from "fs"
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

const uploadDir = "protected/assets/profilePicture";
fs.mkdirSync(uploadDir, { recursive: true });
const form = formidable({
  uploadDir,
  keepExtensions: true,
  filter: (part) => part.mimetype?.startsWith("image/") || false,
});


export async function upLoadProfilePicture(req: Request, res: Response){
  let id = req.session.user?.id;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(507);
      res.json({ err: "fail to up load image", detail: String(err) });
      return;
    }
    let profilePic = files.profilePic;
    if(profilePic==undefined){
      res.end()
      return
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

export async function getProfilePicture(req: Request, res: Response){
  let id = req.session.user?.id;
  const userInfo = {}
  let oldImage = await database.query(
    'select profilePic, user_name from "user" where id = ($1)',
    [id]
  );
  userInfo["oldImageName"] = oldImage.rows[0].profilepic;
  userInfo["userName"] = oldImage.rows[0].user_name
  res.json(userInfo);
};