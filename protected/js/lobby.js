const usernameDisplay = document.querySelector(".username");
const onlineCount = document.querySelector(".online-count");
const newRoomName = document.querySelector("#new-room-name");
const roomList = document.querySelector(".room-list");
const template = document.querySelector("template");
const roomTemplate = template.content.querySelector(".room");

// Global variables;
let roomCapacity = 0;
const socket = io();
let myId, myName;
init();

async function init() {
  // always init socket event first
  socketEventInit();

  myId = await getuserId();
  myName = await getUsername(myId);
  usernameDisplay.textContent = myName;
  roomCapacity = await getRoomCapacity();
  loadRoomList();

  socket.emit("askLobbyInit");
}

function socketEventInit() {
  // on connect update status content
  // socket.on("connect", () => {
  //   status.textContent = "connected: " + socket.id;
  // });

  // on new online update online counter
  socket.on("online-count", (data) => {
    onlineCount.textContent = data;
  });

  // // on new room create show the room
  socket.on("new-room", (room) => {
    showNewRoom(room);
  });

  // on new room inc update the specific room count
  socket.on("new-inc", (room) => {
    const roomElem = roomList.querySelector(`.room[data-id="${room.id}"`);
    const roomCount = roomElem.querySelector(".count");
    roomElem.querySelector(".game-status").textContent = room.playing
      ? "PLAYING"
      : "WAITING";
    roomElem.querySelector(".join-room").style.display = room.playing
      ? "none"
      : "inline-block";

    if (!room.playing) {
      roomCount.textContent = room.count;
    }
  });
}

// adding press enter to submit
newRoomName.addEventListener("keypress", (event) => {
  if (event.key == "Enter") {
    createRoom();
  }
});

//debug msg to see if I can room capacity

// trigger function for create room button --> send ajax request
async function createRoom() {
  let res = await fetch("/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: newRoomName.value,
    }),
  });
  let json = await res.json();
  if (json.error) {
    showError({
      title: "Create room fail",
      text: json.error,
    });
    return;
  } else {
    // redirect to the chatroom
    /* ------------------------------- old version ------------------------------ */
    // location.href = `/user/room?username=${myName}&room=${newRoomName.value}&rid=${json.maxRoomId}`;
    /* ------------------------------- new version ------------------------------ */
    location.href = `/user/room?room=${newRoomName.value}`;
  }
}

function showNewRoom(room) {
  let roomNode = roomTemplate.cloneNode(true);
  roomNode.dataset.id = room.id;
  roomNode.querySelector(".id").textContent = room.id;
  roomNode.querySelector(".name").textContent = room.name;
  roomNode.querySelector(".owner").textContent = room.owner;
  roomNode.querySelector(".count").textContent = room.count;
  roomNode.querySelector(".capacity").textContent = roomCapacity;
  roomNode.querySelector(".game-status").textContent = "WAITING";
  // playing hide irrelevant info
  roomNode.querySelector(".room-count-container").style.display = room.playing
    ? "none"
    : "inline-block";
  roomNode.querySelector(".game-status").textContent = room.playing
    ? "PLAYING"
    : "WAITING";
  roomNode.querySelector(".join-room").style.display = room.playing
    ? "none"
    : "inline-block";
  roomNode.querySelector(".join-room").addEventListener("click", async (e) => {
    let currentCount = +roomNode.querySelector(".count").textContent;
    if (currentCount + 1 > roomCapacity) {
      showError({ title: "Cannot join room", text: "the room is max" });
    } else {
      // joinRoom(room.id);
      location.href = `/user/room?room=${room.name}`;
    }
  });
  roomList.appendChild(roomNode);
}

async function loadRoomList() {
  let res = await fetch("/rooms");
  let json = await res.json();
  if (json.error) {
    showError(json.error);
    return;
  }
  for (let room of json.rooms) {
    showNewRoom(room);
  }
}

// get roomCapacity through get method
async function getRoomCapacity() {
  let res = await fetch("/capacity");
  let json = await res.json();
  if (json.error) {
    showError(json.error);
    return;
  }
  return json.roomCapacity;
}
