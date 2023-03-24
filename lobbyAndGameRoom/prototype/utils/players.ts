// this user is for chatroom, not the session stuff from db
type Player = {
  id: string
  username: string
  room: string
  ready: boolean
}
const players: Player[] = [];

// Join user to chat
export function playerJoin(id: string, username: string, room: string, ready: boolean) {
  const player = { id, username, room, ready };

  players.push(player);

  return player;
}

export function getCurrentPlayer(id: string) {
  return players.find((user) => user.id === id);
}

// User leaves chat
export function playerLeave(id: string) {
  const index = players.findIndex((user) => user.id === id);
  if (index === -1) return;
  return players.splice(index, 1)[0];
}

// Get room players
export function getRoomPlayers(room: string) {
  return players.filter((user) => user.room === room);
}
