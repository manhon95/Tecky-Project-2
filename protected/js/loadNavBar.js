navBarHeader = document.querySelector(".navbar");
navBarHeader.innerHTML = /*html*/ `
<div class="container-fluid">
<div class="navb-logo">
  <a href=""><img src="./assets/coup-logo.jpg" alt="" /></a>
</div>
<div class="navb-items d-flex gap-3">
  <div class="item">
    <a href="gameroom.html">Game lobby</a>
  </div>
  <div class="item-button">
    <a href="./profile.html" type="button">profile</a>
  </div>
</div>
</div>
`;
