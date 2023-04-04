async function init() {}
init();

//to create the drop down options
const date = new Date();
const getYear = date.getYear() + 1900;
const selectYearDropDown = document.getElementById("selectYearDropDown");
const selectMonthDropDown = document.getElementById("selectMonthDropDown");
for (let y = getYear; y >= 1900; y--) {
  const createYear = document.createElement("option");
  createYear.value = y;
  createYear.text = y;
  selectYearDropDown.appendChild(createYear);
}
for (let y = 1; y <= 12; y++) {
  const createMonth = document.createElement("option");
  createMonth.value = y;
  createMonth.text = y;
  selectMonthDropDown.appendChild(createMonth);
}

//---------------------send register form to store in database  --------------------------
document
  .querySelector(".registerForm")
  .addEventListener("submit", async function (event) {
    document.querySelector("#submit").disabled = true;

    event.preventDefault();
    const form = event.target;
    const formObject = {};

    formObject["title"] = form.title.value;
    formObject["userName"] = form.userName.value;
    formObject["monthOfBirth"] = form.monthOfBirth.value;
    formObject["yearOfBirth"] = form.yearOfBirth.value;
    formObject["email"] = form.email.value;
    formObject["password"] = form.password.value;
    formObject["confirmPassword"] = form.confirmPassword.value;
    const res = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formObject),
    });
    const result = await res.json();
    if (result.success == "success") {
      console.log("here");
      location.href = "/verify";
    } else {
      document.querySelector("#submit").disabled = false;
    }

    for (const key in result) {
      if (key == "email" || key == "password") {
        document.querySelectorAll(`.${key}`).forEach((i) => {
          // if (result[key]) {
          //   i.style.border = "solid 5px green";
          // } else {
          //   i.style.border = "solid 5px red";
          // }
          i.style.border = result[key] ? "solid 5px green" : "solid 5px red";
        });
      } else {
        document.querySelector(`.${key}`).textContent = result[key];
      }
    }
  });

//--------------------- return to login page --------------------------
document.querySelector(".backArrow").addEventListener("click", () => {
  location.href = "/login";
});
