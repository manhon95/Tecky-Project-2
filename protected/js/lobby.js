const usernameDisplay = document.querySelector(".username");
const status = document.querySelector(".status");
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

  myId = await getUserId();
  myName = await getUsername(myId);
  usernameDisplay.textContent = myName;
  roomCapacity = await getRoomCapacity();
  loadRoomList();

  socket.emit("askLobbyInit");
}

function socketEventInit() {
  // on connect update status content
  console.log(socket);
  socket.on("connect", () => {
    console.log("connected");
    status.textContent = "connected: " + socket.id;
  });

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
    let roomCount = roomList.querySelector(
      `.room[data-id="${room.id}"] .count`
    );

    roomCount.textContent = room.count;
  });
}

// adding press enter to submit
newRoomName.addEventListener("keypress", (event) => {
  if (event.key == "Enter") {
    createRoom();
  }
});

//Log out function
document
  .querySelector(".logOutButton")
  .addEventListener("click", async function () {
    const res = await fetch("/login/logout", {
      method: "post",
    });
    location.href = "/login";
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
    location.href = `/user/room?username=${myName}&room=${newRoomName.value}&rid=${json.maxRoomId}`;
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
  roomNode.querySelector(".join-room").addEventListener("click", async (e) => {
    let currentCount = +roomNode.querySelector(".count").textContent;
    if (currentCount + 1 > roomCapacity) {
      showError({ title: "Cannot join room", text: "the room is max" });
    } else {
      // joinRoom(room.id);
      location.href = `/user/room?username=${myName}&room=${room.name}&rid=${room.id}`;
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
