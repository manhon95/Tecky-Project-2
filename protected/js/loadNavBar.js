async function loadProfileNamePic() {
  let res = await fetch(`/profilePic`, {
    method: "get",
  });
  let Result = await res.json();
  profileName.textContent = Result.userName;
  profilePic.src = Result.oldImageName.includes("https")
    ? Result.oldImageName
    : `./assets/profilePicture/${Result.oldImageName}`;
}
loadProfileNamePic();



navBarHeader = document.querySelector(".navbar");
navBarHeader.innerHTML = /*html*/ `
<div class="container-fluid">
<div class="navb-logo">
  <a href=""><img src="./assets/coup-logo.jpg" alt="" /></a>
</div>
<div class="navb-items d-flex ">

  <div class="buttonGroup d-flex me-3 gap-3">
    <div class="item">
      <a href="/user/social">Social</a>
    </div>
    <div class="item">
      <a href="/user/lobby">Game lobby</a>
    </div>
    <div class="item">
      <a href="shop.html">Shop</a>
    </div>
  </div>

  <div class="item-button d-flex">
    <div id="dropdown" class="dropdown me-3">
      <button
        class="btn btn-secondary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        Dropdown button
      </button>
      <ul class="dropdown-menu">
        <li>
          <div class="item dropdown-item">
            <a href="/user/social">Social</a>
          </div>
        </li>
        <li>
          <div class="item dropdown-item">
            <a href="/user/lobby">Game lobby</a>
          </div>
        </li>
        <li>
          <div class="item dropdown-item">
            <a href="shop.html">Shop</a>
          </div>
        </li>
      </ul>
    </div>
  </div>

  <div>
    <img id="profilePic" src="" alt="" class="profileImg" />
  </div>

  <div id="profiledropdown" class="dropdown">
    <button
      class="btn btn-secondary dropdown-toggle"
      type="button"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      <span id="profileName">vfdbdf</span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end">
      <li>
        <div class="item dropdown-item">
          <a href="/user/profile">View my profile</a>
        </div>
      </li>
      <li>
        <div class="item dropdown-item">
          <a type="button" id="logOutButton" class="logOutButton"
            >Log Out</a
          >
        </div>
      </li>
    </ul>
  </div>

  <!-- <a id="profileName" href="/user/profile" type="button"></a> -->
</div>
</div>
`;

//Log out function
document
  .querySelector("#logOutButton")
  .addEventListener("click", async function () {
    const res = await fetch("/login/logout", {
      method: "post",
    });
    location.href = "/login";
  });
