const usernameDisplay = document.querySelector(".username");
const status = document.querySelector(".status");
const onlineCount = document.querySelector(".online-count");
const newRoomName = document.querySelector("#new-room-name");
const roomList = document.querySelector(".room-list");
const template = document.querySelector("template");
const roomTemplate = template.content.querySelector(".room");

// Global variables;
let username = "";
let roomCapacity = 0;
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

async function loadInfoFromServer() {
  // update the user name when pages refresh
  username = await getUsername();
  usernameDisplay.textContent = username;
  roomCapacity = await getRoomCapacity();
  loadRoomList();
}

loadInfoFromServer().catch((e) => console.error(e));
//debug msg to see if I can room capacity

let socket = io.connect();

// on connect update status content
socket.on("connect", () => {
  status.textContent = "connected: " + socket.id;
});

// on new online update online counter
socket.on("online-count", (data) => {
  onlineCount.textContent = data;
});

// on new room create show the room
socket.on("new-room", (room) => {
  showNewRoom(room);
});

// on new room inc update the specific room count
socket.on("new-inc", (room) => {
  let roomCount = roomList.querySelector(`.room[data-id="${room.id}"] .count`);

  roomCount.textContent = room.count;
});

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
    location.href = `/user/room?username=${username}&room=${newRoomName.value}&rid=${json.maxRoomId}`;
  }
}

// emit message to update others through SIO when join room
// function joinRoom(room_id) {
//   socket.emit("inc-room-count", room_id);
// }

function showNewRoom(room) {
  let roomNode = roomTemplate.cloneNode(true);
  roomNode.dataset.id = room.id;
  roomNode.querySelector(".id").textContent = room.id;
  roomNode.querySelector(".name").textContent = room.name;
  console.log(room.owner);
  roomNode.querySelector(".owner").textContent = room.owner;
  roomNode.querySelector(".count").textContent = room.count;
  roomNode.querySelector(".capacity").textContent = roomCapacity;
  roomNode.querySelector(".join-room").addEventListener("click", async (e) => {
    let currentCount = +roomNode.querySelector(".count").textContent;
    if (currentCount + 1 > roomCapacity) {
      showError({ title: "Cannot join room", text: "the room is max" });
    } else {
      // joinRoom(room.id);
      location.href = `/user/room?username=${username}&room=${room.name}&rid=${room.id}`;
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

// Update the login username and display in the welcome page
async function getUsername() {
  const usernameRes = await fetch("/username");
  const usernameResult = await usernameRes.json();

  return usernameResult.username;
}
