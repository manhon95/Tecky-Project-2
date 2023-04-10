export type Room = {
  id: number;
  name: string;
  owner: string;
  count: number;
  playing: boolean;
};

export let rooms: Room[] = [];

export function changeRoomStatusToWaiting(gameName: string) {
  let rid = rooms.findIndex((rmName) => rmName.name == gameName);
  rooms[rid].playing = false;
}
