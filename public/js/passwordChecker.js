// async function alert() {
//   const res = await fetch("/register", {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   const result = await res.json();
//   console.log("result");
//   console.log(result);
// }
// alert();
const rmCheck = document.querySelector(".rememberMe");
const email = document.querySelector(".email");
const password = document.querySelector(".password");

if (localStorage.rmCheck && localStorage.rmCheck !== "") {
  rmCheck.setAttribute("checked", "checked");
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
    const res = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formObject),
    });

    const result = await res.json(); // { success: true }
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
      location.href = "/user/gameroom";
    }
  });
