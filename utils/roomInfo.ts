export type Room = {
  id: number;
  name: string;
  owner: string;
  count: number;
  playing: boolean;
};
export let rooms: Room[] = [];
