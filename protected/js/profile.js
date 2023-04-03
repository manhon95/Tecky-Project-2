const userName = document.querySelector(".user-name");
const userId = document.querySelector(".user-id");
const userBirthday = document.querySelector(".user-birthday");
const userElo = document.querySelector(".user-elo");
const changeNameBtn = document.querySelector(".change-name-btn");

let myId;

init();

async function init() {
  const socket = io();
  myId = await getUserId();
  await loadProfile();
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
    await loadProfileNamePic()
    return;
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