const chatForm = document.querySelector("#chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.querySelector("#room-name");
const playerList = document.querySelector("#player-list");
const leaveBtn = document.querySelector(".leave-btn");
const template = document.querySelector("template");
const readyBtn = document.querySelector(".ready-btn");

const socket = io();
let myId;

readyBtn.addEventListener("click", () => {
  // console.log("sent emit", clientSocketID);
  socket.emit("ready");
});

// Get username and room from URL
const { username, room, rid } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// Leave button decrement room count and direct back to lobby
leaveBtn.addEventListener("click", () => {
  location.href = "/user/lobby.html";
});

main().catch((e) => console.error(e));

// Get the userId and send to server
async function main() {
  //init myId
  const res = await fetch("/user-id");
  const result = await res.json();
  myId = result.id;

  // Join chatroom
  socket.emit("join-room", { username, room, rid, myId });

  // Get room and users
  socket.on("room-players", async ({ room, players }) => {
    //TODO check if room is needed here
    outputRoomName(room);
    await outputPlayers(players);
  });

  // Message from server
  socket.on("message", (message) => {
    outputMessage(message);
    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // prompt friend-request when received
  socket.on("prompt-friend-request", (senderName) => {
    Swal.fire({
      position: "top-end",
      icon: "info",
      title: `being added by ${senderName}`,
      text: "Check in the social center",
      showConfirmButton: false,
      timer: 1000,
    });
  });
  // Message submit
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // Get message text
    const msg = e.target.elements.msg.value;

    // Emit message to server
    socket.emit("chatMessage", msg);

    // Clear input
    e.target.elements.msg.value = "";
    e.target.elements.msg.focus();
  });
  // start the game when all ready
  socket.on("redirect-to-game", () => {
    location.href = `coup-game.html?game=${room}`;
  });
}

// Output message to DOM

function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
      <p class="text">
       ${message.text}
      </p>`;
  document.querySelector(".chat-messages").appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room; //TODO check if this function is needed
}

// Add users to DOM
async function outputPlayers(players) {
  // clear all node
  while (playerList.firstChild) {
    playerList.removeChild(playerList.firstChild);
  }
  players.map((player) => {
    const playerNode = template.content
      .querySelector(".player")
      .cloneNode(true);
    const playerName = playerNode.querySelector(".player-name");
    playerName.textContent = player.username;
    const playerReadyState = playerNode.querySelector(".player-ready-state");

    if (player.ready) {
      playerReadyState.textContent = "READY";
      playerReadyState.classList.add("ready");
    } else {
      playerReadyState.textContent = "NOT READY";
      playerReadyState.classList.remove("ready");
    }

    if (player.userId === myId) {
      playerList.appendChild(playerNode);
      return;
    }
    // when hovering a user in a room --> check if they are friend(apply only on non-current user)
    playerName.addEventListener("mouseover", async () => {
      const profile = playerNode.querySelector(".profile");

      profile.style.display = "block";
      profile.addEventListener("mouseleave", () => {
        profile.style.display = "none";
      });
      // console.log(`You are hovering ${player.userId}`);
      if (await checkFriend(myId, player.userId)) {
        profile.querySelector(".friend-status").textContent = "friend";
      } else {
        profile.querySelector(".friend-status").textContent = "not friend";
        const button = template.content
          .querySelector(".add-friend-btn")
          .cloneNode(true);
        button.addEventListener("click", async () => {
          // firing a add friend request
          const res = await fetch(`/friend-requests/${myId}/${player.userId}`, {
            method: "POST",
          });
          const result = await res.json();
          if (result.success) {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: `Sent friend request to ${player.username}`,
              showConfirmButton: false,
              timer: 1000,
            });
            // update the friend request receiver immediately
            socket.emit("add-friend", {
              receiverSocketId: player.socketId,
              senderName: username,
            });
            return;
          }
          showError({ title: "", text: `You cannot add yourself` });
        });
        if (!profile.querySelector(".add-friend-btn")) {
          profile.appendChild(button);
        }
      }
    });

    playerList.appendChild(playerNode);
  });

  //       userList.innerHTML = `
  //   ${users.map((user) => `<li>${user.username}</li>`).join("")}
  // `;
}

// check friend function
async function checkFriend(myId, someoneId) {
  let res = await fetch(`/friends/${myId}/${someoneId}`);
  let result = await res.json();
  return result.areFriends;
}
