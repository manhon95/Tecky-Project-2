
// import {getProfilePic} from "./commonUtils.js"
// async function getProfilePic() {
//   const Res = await fetch("/username");
//   const Result = await Res.json();
//   return Result.getProfilePic;
// }
async function getProfilePic() {
  const Res = await fetch("/profilePic");
  const Result = await Res.json();
  return Result;
}

(async ()=>{
  navBarHeader = document.querySelector(".navbar");
navBarHeader.innerHTML = /*html*/ `
<div class="container-fluid">
<div class="navb-logo">
  <a href=""><img src="./assets/coup-logo.jpg" alt="" /></a>
</div>
<div class="navb-items d-flex gap-3">
  <div class="item">
    <a href="social.html">Social</a>
  </div>
  <div class="item">
    <a href="gameroom.html">Game lobby</a>
  </div>
  <div class="item-button d-flex">
    <div >
    <img src="${await getProfilePic()}" alt="" class="profileImg"></div>
    <a href="./profile.html" type="button">profile</a>
  </div>
</div>
</div>
`;
})()
