async function loadProfileNamePic(){
  let res = await fetch(`/profilePic`, {
    method: "get",
  });
  let Result = await res.json();
  profileName.textContent = Result.userName;
  profilePic.src = Result.oldImageName.includes("https")? Result.oldImageName : `./assets/profilePicture/${Result.oldImageName}`
};
loadProfileNamePic()

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
    <a id="profileName" href="/user/profile" type="button"></a>
  </div>
</div>
</div>
`;
