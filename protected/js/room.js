// Global variable
const chatForm = document.querySelector("#chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.querySelector("#room-name");
const playerList = document.querySelector("#player-list");
const leaveBtn = document.querySelector(".leave-btn");
const template = document.querySelector("template");
const readyBtn = document.querySelector(".ready-btn");
const profiles = template.content.querySelectorAll(".profile");

const socket = io();
const { room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
let myId, username;

init();

async function init() {
  //put all init in this function
  //init myId
  const res = await fetch("/user-id");
  const result = await res.json();
  myId = result.id;
  username = await getUsername(myId);
  console.log(room, username);
  roomName.innerText = room;
  //uncomment below if socketIo is used, replace {Page} to the page name

  socket.emit("askRoomInit", { username, room, myId });
  // Message submit

  htmlInit();
  socketEventInit();
}

/* -------------------------- all socketEvent here -------------------------- */
function socketEventInit() {
  // Get room and users
  socket.on("room-players", async ({ room, players }) => {
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

  socket.on("redirect-to-game", (gameId) => {
    location.href = `coup.html?game=${gameId}`;
  });

  // Add users to DOM when received socketIO event
  async function outputPlayers(players) {
    // clear all node
    while (playerList.firstChild) {
      playerList.removeChild(playerList.firstChild);
    }

    players.map(async (player) => {
      const playerNode = template.content
        .querySelector(".player")
        .cloneNode(true);

      // get userMatch history & profile & profile picture
      let matchRes = await fetch(`/matchHistory/${player.userId}`);
      let matchObj = await matchRes.json();
      let profileRes = await fetch(`/profiles/${player.userId}`);
      let profileObj = await profileRes.json();
      let profilePicUrl = profileObj.profilePicUrl;
      // console.log(profilePicUrl);
      //  profilePic.src = Result.oldImageName.includes("https")? Result.oldImageName : `./assets/profilePicture/${Result.oldImageName}`

      // add event listener first
      playerNode.querySelectorAll(".profile").forEach((profile) => {
        profile.addEventListener("mouseleave", (e) => {
          e.target.style.display = "none";
        });
      });
      let activeBadge = await loadActiveBadgeUrl(player.userId);
      if (activeBadge) {
        playerNode.querySelector(".player-badge").src = activeBadge;
      }
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

      if (player.userId !== myId) {
        const addFriendBtn = playerNode.querySelector(".add-friend-btn");
        playerName.addEventListener("mouseover", async () => {
          // console.log(`You are hovering ${player.userId}`);
          if (await checkFriend(myId, player.userId)) {
            const friendProfile = playerNode.querySelector(".friend-profile");
            friendProfile.style.display = "block";
            friendProfile.querySelector(".profile-pic").src =
              profilePicUrl.includes("https")
                ? profilePicUrl
                : `./assets/profilePicture/${profilePicUrl}`;
            friendProfile.querySelector(".profile-username").textContent =
              profileObj.profile.user_name;
            friendProfile.querySelector(".profile-elo").textContent =
              profileObj.profile.elo;
            friendProfile.querySelector(".profile-game-played").textContent =
              matchObj.gamePlayed;
            friendProfile.querySelector(".profile-game-won").textContent =
              matchObj.gameWon;
            friendProfile.querySelector(".profile-win-rate").textContent =
              matchObj.winRate + "%";
            friendProfile.querySelector(".profile-birthday").textContent =
              profileObj.profile.birthday;
          } else {
            const nonFriendProfile = playerNode.querySelector(
              ".non-friend-profile"
            );
            nonFriendProfile.style.display = "block";
            nonFriendProfile.querySelector(".profile-pic").src =
              profilePicUrl.includes("https")
                ? profilePicUrl
                : `./assets/profilePicture/${profilePicUrl}`;
            nonFriendProfile.querySelector(".profile-username").textContent =
              profileObj.profile.user_name;
            nonFriendProfile.querySelector(".profile-elo").textContent =
              profileObj.profile.elo;
            nonFriendProfile.querySelector(".profile-game-played").textContent =
              matchObj.gamePlayed;
          }
        });
        addFriendBtn.addEventListener("click", async () => {
          // firing a add friend request
          await fetch(`/friend-requests/${myId}/${player.userId}`, {
            method: "POST",
          });
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
        });
      } else {
        playerName.style.color = "blue";
        playerName.style.fontWeight = "bold";
      }
      playerList.appendChild(playerNode);
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
}

function htmlInit() {
  // When player press enter emit the msg and update
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

  // When player press ready emit the msg and update
  readyBtn.addEventListener("click", () => {
    // console.log("sent emit", clientSocketID);
    socket.emit("ready");
  });

  // Leave button decrement room count and direct back to lobby
  leaveBtn.addEventListener("click", () => {
    location.href = "/user/lobby.html";
  });
}

/* ------------------------ request related function ------------------------ */
// check friend function
async function checkFriend(myId, someoneId) {
  let res = await fetch(`/friends/${myId}/${someoneId}`);
  let result = await res.json();
  return result.areFriends;
}

async function loadActiveBadgeUrl(userId) {
  let res = await fetch(`/users/${userId}/activeBadge`);
  let activeBadge = await res.json();

  if (activeBadge.length == 0) {
    return false;
  }
  return activeBadge[0].url;
}
