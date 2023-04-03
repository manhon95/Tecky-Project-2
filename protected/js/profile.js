const userName = document.querySelector(".user-name");
const userId = document.querySelector(".user-id");
const userBirthday = document.querySelector(".user-birthday");
const userElo = document.querySelector(".user-elo");
const changeNameBtn = document.querySelector(".change-name-btn");
const badgeList = document.querySelector(".badge-list");

const activeBadgeContainer = document.querySelector(".active-badge");
const activeBadgeName = document.querySelector(".active-badge-name");
const activeBadgeIcon = document.querySelector(".active-badge-icon");
const unloadBtn = document.querySelector(".unload-btn");
const template = document.querySelector("template");
let myId;

init();

async function init() {
  const socket = io();
  myId = await getUserId();
  await loadProfile();
  await loadUserBadges();
  await loadActiveBadge();
  // change name button trigger ajax request to change name
  changeNameBtn.addEventListener("click", async () => {
    let obj = {};
    let newName = document.querySelector(".new-name").value;
    // console.log(newName);
    obj["newName"] = newName;
    if (newName.length === 0) {
      showError({ title: "wrong input", text: "cannot be 0 length" });
      return;
    }
    await fetch(`/usernames/${myId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(obj),
    });

    showSuccess({
      title: "success",
      text: "username updated",
    });
    await loadProfile();
    await loadProfileNamePic();
    return;
  });

  unloadBtn.addEventListener("click", async () => {
    await fetch(`/users/${myId}/activeBadge/${-1}`, {
      method: "PATCH",
    });
    showSuccess({ title: "!!!", text: "you have unloaded the badge!" });
    await loadActiveBadge();
  });
}

async function loadProfile() {
  const res = await fetch(`/profiles/${myId}`);
  const result = await res.json();
  userId.textContent = result.id;
  userName.textContent = result.user_name;
  userBirthday.textContent = result.birthday;
  userElo.textContent = result.elo;
  return result;
}
async function getUserId() {
  let res = await fetch("/user-id");
  let result = await res.json();
  return result.id;
}

//upload profile picture
async function upLoadProfilePicture(event) {
  event.preventDefault();
  let form = event.target;
  let formData = new FormData(form);
  let res = await fetch(`${form.action}`, {
    method: "put",
    body: formData,
  });
  let Result = await res.json();
  if (Result.error) {
    message.textContent = Result.error;
    return;
  }

  profilePic.src = `./assets/profilePicture/${Result}`;
}

async function loadUserBadges() {
  console.log("load user badge");
  let res = await fetch(`/users/${myId}/badges`);
  let userBadge = await res.json();
  if (userBadge.length == 0) {
    badgeList.innerHTML = "<h1>no item sad</h1>";
  }
  userBadge.forEach((badge) => {
    const badgeNode = template.content.querySelector(".badge").cloneNode(true);
    badgeNode
      .querySelector(".set-active-btn")
      .addEventListener("click", async () => {
        console.log({ myId, badgeId: badge.id });
        await fetch(`/users/${myId}/activeBadge/${badge.id}`, {
          method: "PATCH",
        });
        showSuccess({
          title: "success",
          text: "active batch updated",
        });
        await loadActiveBadge();
      });
    // console.log(badge);
    badgeNode.querySelector(".badge-name").textContent = badge.name;
    badgeNode.querySelector(".badge-icon").src = badge.url;
    badgeList.appendChild(badgeNode);
  });
}

async function loadActiveBadge() {
  let res = await fetch(`/users/${myId}/activeBadge`);
  let activeBadge = await res.json();
  if (activeBadge.length == 0) {
    activeBadgeName.innerHTML = "<h1>no active badge yet</h1>";
    unloadBtn.style.display = "none";
    activeBadgeIcon.src = "";
  } else {
    unloadBtn.style.display = "inline-block";
    activeBadgeName.textContent = activeBadge[0].name;
    activeBadgeIcon.src = activeBadge[0].url;
  }

  // const badgeNode = template.content.querySelector(".badge").cloneNode(true);

  // // console.log(badge);
  // badgeNode.querySelector(".badge-name").textContent = badge.name;
  // badgeNode.querySelector(".badge-icon").src = badge.url;
  // badgeList.appendChild(badgeNode);
}
