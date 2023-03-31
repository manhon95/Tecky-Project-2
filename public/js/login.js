async function init() {
  // TODO: ask victor what to put inside
}
init();

const rmCheck = document.querySelector(".rememberMe");
const email = document.querySelector(".email");
const password = document.querySelector(".password");

if (localStorage.rmCheck && localStorage.rmCheck !== "") {
  rmCheck.checked = true;
  email.value = localStorage.email;
  password.value = localStorage.password;
}

document
  .querySelector(".loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;
    const formObject = {};

    formObject["email"] = form.email.value;
    formObject["password"] = form.password.value;
    formObject["errorMessage"] = "";
    const res = await fetch("/login/password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formObject),
    });

    const result = await res.json(); // { error: string|undefined }
    if (result.error) {
      document.querySelector(".wrongPasswordMessage").textContent =
        result.error;
    } else {
      if (rmCheck.checked && email.value != "" && password.value != "") {
        console.log("saved ");
        localStorage.setItem("email", email.value);
        localStorage.setItem("password", password.value);
        localStorage.setItem("rmCheck", rmCheck.checked);
      } else {
        localStorage.removeItem("email");
        localStorage.removeItem("password");
        localStorage.removeItem("rmCheck");
      }
      location.href = "/user/lobby";
    }
  });
