import database from "../db";

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

export async function getProfilePic(id: string) {
  let result = await database.query(
    /*sql*/ `
select profilepic from "user" where id = ($1)
`,
    [id]
  );
  return result;
}

// are db handling method
export async function getProfileFromDB(id: number | undefined) {
  if (id === undefined) return "error, id not exist";
  let result = await database.query(
    /*sql*/ `
select id, user_name, birthday, elo from "user" where id= $1
  `,
    [id]
  );
  return result.rows[0];
}

export async function getUsernameFromDB(id: string | null) {
  if (id === undefined) return "error, id not exist";
  let result = await database.query(
    /*sql*/ `
select user_name from "user" where id= $1
  `,
    [id]
  );
  return result.rows[0].user_name;
}
