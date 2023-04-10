const template = document.querySelector("template");

const friendList = document.querySelector(".friend-list");
let myId;

async function init() {
  const socket = io();
  myId = await getuserId();
  console.log(myId);

  showFriends(await loadFriends());

  showFriendRequest(await loadRequests());
  socket.emit("askSocialInit");
}

async function loadFriends() {
  // getting all the friends from server
  let friendsRes = await fetch(`/users/${myId}/friends`);
  let friendsResult = await friendsRes.json();
  let friends = friendsResult.friends;
  return friends;
}
async function loadRequests() {
  // getting all the friends request from server
  let friendRequestsRes = await fetch(`/users/${myId}/requests`);
  let friendRequestsResult = await friendRequestsRes.json();
  let friendRequests = friendRequestsResult.requests;
  return friendRequests;
}
// listing out all the friends
function showFriends(friends) {
  const friendTemplate = template.content.querySelector(".friend-record");
  clearAllChildNode(friendList);
  // console.log(friendList.children);

  // console.log(friends);
  friends.map((friend) => {
    const friendNode = friendTemplate.cloneNode(true);
    friendNode.querySelector(".friend-id").textContent = friend.id;
    friendNode.querySelector(".friend-name").textContent = friend.user_name;
    friendNode.querySelector(".friend-email").textContent = friend.email;
    friendNode.querySelector(".friend-elo").textContent = friend.elo;
    friendNode
      .querySelector(".unfriend-btn")
      .addEventListener("click", async (e) => {
        Swal.fire({
          title: `Are you sure you want to unfriend ${friend.user_name}?`,
          showDenyButton: true,
          showCancelButton: false,
          confirmButtonText: "Yes",
          denyButtonText: `No`,
        }).then(async (result) => {
          /* Read more about isConfirmed, isDenied below */
          if (result.isConfirmed) {
            let userId = await getuserId();
            let res = await fetch(`/users/${userId}/friends/${friend.id}`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
            });
            let result = await res.json();

            if (result.success) {
              showFriends(await loadFriends());
              Swal.fire(`unfriended ${friend.user_name}!`);
            } else {
              showError({
                title: "unknown bug",
                text: "database have no record to delete",
              });
            }
          } else if (result.isDenied) {
            Swal.fire("Cancelled");
          }
        });
      });

    friendList.appendChild(friendNode);
  });
}

// listing all the friend request
function showFriendRequest(friendRequests) {
  let friendRequestList = document.querySelector(".friend-request-list");

  clearAllChildNode(friendRequestList);
  // console.log(template.content);
  let friendRequestTemplate = template.content.querySelector(
    ".friend-request-record"
  );
  friendRequests.map((request) => {
    let requestNode = friendRequestTemplate.cloneNode(true);
    requestNode.querySelector(".request-id").textContent = request.id;
    requestNode.querySelector(".sender-name").textContent = request.sender_name;
    requestNode.querySelector(".message").textContent = request.message;
    requestNode
      .querySelector(".accept-btn")
      .addEventListener("click", async () => {
        let res = await fetch(`/friend-requests/${request.id}/accept`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });
        let result = await res.json();
        showFriends(await loadFriends());
        showFriendRequest(await loadRequests());
        showSuccess({
          title: "Success",
          text: `You have added ${request.sender_name} as friend!`,
        });
      });
    requestNode
      .querySelector(".reject-btn")
      .addEventListener("click", async () => {
        let res = await fetch(`/friend-requests/${request.id}/reject`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });
        showFriends(await loadFriends());
        showFriendRequest(await loadRequests());
        showSuccess({
          title: "Success",
          text: `You have rejected ${request.sender_name}'s friend request!`,
        });
      });
    friendRequestList.appendChild(requestNode);
  });
}

init();
