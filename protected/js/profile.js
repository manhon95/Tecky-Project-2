const userName = document.querySelector(".user-name");
const userId = document.querySelector(".user-id");
const userBirthday = document.querySelector(".user-birthday");
const userElo = document.querySelector(".user-elo");
const changeNameBtn = document.querySelector(".change-name-btn");
const badgeList = document.querySelector(".badge-list");
const matchHistoryList = document.querySelector(".match-history-list");
const activeBadgeContainer = document.querySelector(".active-badge");
const activeBadgeName = document.querySelector(".active-badge-name");
const activeBadgeIcon = document.querySelector(".active-badge-icon");
const unloadBtn = document.querySelector(".unload-btn");
const gamePlayed = document.querySelector(".game-played");
const gameWon = document.querySelector(".game-won");
const winRate = document.querySelector(".win-rate");
const template = document.querySelector("template");
const changePassword = document.querySelector("#changePassword");
const changePasswordSubmitGroup = document.querySelector(
  "#changePasswordSubmitGroup"
);
const successMessage = document.querySelector("#successMessage");
const setPasswordMessage = document.querySelector("#setPasswordMessage");
const setPasswordMessage2 = document.querySelector("#setPasswordMessage2");
const newPasswordSubmit = document.querySelector("#newPasswordSubmit");
const newPasswordForm = document.querySelector("#newPasswordForm");

let myId;

init();

async function init() {
  const socket = io();
  myId = await getuserId();
  await loadProfile();
  await loadUserBadges();
  await loadActiveBadge();
  await loadMatchHistory();
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
  userId.textContent = result.profile.id;
  userName.textContent = result.profile.user_name;
  // userBirthday.textContent = result.profile.birthday;
  userElo.textContent = result.profile.elo;
  return result;
}
async function getuserId() {
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
  profilePicture.src = `./assets/profilePicture/${Result}`;
}

async function loadUserBadges() {
  // console.log("load user badge");
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
        // console.log({ myId, badgeId: badge.id });
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
  // console.log(activeBadge);
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

async function loadMatchHistory() {
  // match_date ---- match_name ---- participant ---  winner
  // console.log("trying to ask history");
  let res = await fetch(`/matchHistory/${myId}`);
  let obj = await res.json();
  // console.log(template.content);
  if (obj.gamePlayed != 0) {
    winRate.textContent = obj.winRate + "%";

    obj.history.map((match) => {
      const historyNode = template.content
        .querySelector(".match-history")
        .cloneNode(true);
      historyNode.querySelector(".match-id").textContent = match.match_id;
      historyNode.querySelector(".match-time").textContent = match.match_date;
      historyNode.querySelector(".participant").textContent =
        match.participants;
      historyNode.querySelector(".winner").textContent = match.winner;

      matchHistoryList.appendChild(historyNode);
    });
    return;
  } else {
    winRate.textContent = "N/A";
  }
  gamePlayed.textContent = obj.gamePlayed;
  gameWon.textContent = obj.gameWon;

  // clone node
}

async function loadMatchHistory() {
  // match_date ---- match_name ---- participant ---  winner
  // console.log("trying to ask history");
  let res = await fetch(`/matchHistory/${myId}`);
  let obj = await res.json();
  // console.log(template.content);
  if (obj.gamePlayed != 0) {
    winRate.textContent = obj.winRate + "%";

    obj.history.map((match) => {
      const historyNode = template.content
        .querySelector(".match-history")
        .cloneNode(true);
      historyNode.querySelector(".match-id").textContent = match.match_id;
      historyNode.querySelector(".match-time").textContent = match.match_date;
      historyNode.querySelector(".participant").textContent =
        match.participants;
      historyNode.querySelector(".winner").textContent = match.winner;

      matchHistoryList.appendChild(historyNode);
    });
  } else {
    winRate.textContent = "N/A";
  }
  gamePlayed.textContent = obj.gamePlayed;
  gameWon.textContent = obj.gameWon;
  // clone node
}

/* -------------------------- get verification code ------------------------- */
changePassword.addEventListener("click", async () => {
  changePasswordSubmitGroup.classList.remove("hidden");
  changePassword.classList = "hidden";
  successMessage.classList = "hidden";
  await fetch("/getPasswordVerifyCode", {
    method: "get",
  });
});

/* ----------------------- check verificationCode code ---------------------- */
changePasswordSubmitGroup.addEventListener("submit", async function (event) {
  event.preventDefault();
  document.querySelector("#changePasswordSubmit").disabled = true;
  const form = event.target;
  const res = await fetch("/submitVerifyCode", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: form.changePasswordCode.value }),
  });
  let result = await res.json();
  if (result.pass) {
    changePasswordSubmitGroup.classList.add("hidden");
    newPasswordForm.classList.remove("hidden");
    changePasswordCode.value = "";
    changePasswordSubmit.disabled = false;
  } else {
    codeMessage.textContent = result.message;
    changePasswordSubmit.disabled = false;
  }
});

/* --------------------------- input new password --------------------------- */
newPasswordForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  newPasswordSubmit.disabled = true;
  const form = event.target;
  let checkStatus = true;
  if (form.newPassword.value.length < 8) {
    setPasswordMessage.textContent = "Password must be 8 or more character";
    checkStatus = false;
  } else {
    setPasswordMessage.textContent = "";
  }
  if (form.newPassword.value != form.newPasswordConfirm.value) {
    setPasswordMessage2.textContent = "Confirm password is different";
    checkStatus = false;
  } else {
    setPasswordMessage2.textContent = "";
  }
  // console.log(checkStatus)
  if (checkStatus) {
    const res = await fetch("/changeNewPassword", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: form.newPassword.value,
        ConfirmPassword: form.newPasswordConfirm.value,
      }),
    });
    let result = await res.json();
    newPasswordForm.classList.add("hidden");
    changePassword.classList.remove("hidden");
    newPasswordSubmit.disabled = false;
    newPassword.value = "";
    newPasswordConfirm.value = "";
    successMessage.classList = "show";
  } else {
    newPasswordSubmit.disabled = false;
  }
});
