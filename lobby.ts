export type Room = {
  id: number;
  name: string;
  owner: string;
  count: number;
};
export let rooms: Room[] = [];
export const roomCapacity = 4;
