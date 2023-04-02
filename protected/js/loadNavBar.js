async function getProfilePic() {
  const Res = await fetch("/profilePic");
  let result = await Res.json();
  profilePic.src = result;
  // console.log(result)
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

(async () => {
  let res = await fetch(`/profilePic`, {
    method: "get",
  });
  let Result = await res.json();
  // if (json.error) {
  //   message.textContent = json.error;
  //   return;
  // }
  if (Result.includes("https")) {
    profilePic.src = Result;
    return;
  }
  profilePic.src = `./assets/profilePicture/${Result}`;
})();

navBarHeader = document.querySelector(".navbar");
navBarHeader.innerHTML = /*html*/ `
<div class="container-fluid">
<div class="navb-logo">
  <a href=""><img src="./assets/coup-logo.jpg" alt="" /></a>
</div>
<div class="navb-items d-flex gap-3">
  <div class="item">
    <a href="/user/social">Social</a>
  </div>
  <div class="item">
    <a href="/user/lobby">Game lobby</a>
  </div>
  <div class="item">
    <a href="shop.html">Shop</a>
  </div>
  <div class="item-button d-flex">
    <div >
    <img id="profilePic" src="" alt="" class="profileImg"></div>
    <a href="/user/profile" type="button">profile</a>
  </div>
</div>
</div>
`;
