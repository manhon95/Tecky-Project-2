
//---------------------send register form to store in database  --------------------------
document.querySelector(".registerForm")
.addEventListener("submit", async function (event) {
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
      location.href = "/user/gameroom";
    }
    for (const key in result) {
      const div = document.querySelectorAll(`.${key}`);
      if (key == "email" || key == "password") {
        for (let i of div) {
          if (result[key]) {
            i.style.border = "solid 5px green";
          } else {
            i.style.border = "solid 5px red";
          }
        }
      } else {
        document.querySelector(`.${key}`).textContent = result[key];
      }
    }
  });

//to create the drop down options
let date = new Date();
let getYear = date.getYear() + 1900;
let selectYearDropDown = document.getElementById("selectYearDropDown");
let selectMonthDropDown = document.getElementById("selectMonthDropDown");
for (let y = getYear; y >= 1900; y--) {
  let createYear = document.createElement("option");
  createYear.value = y;
  createYear.text = y;
  selectYearDropDown.appendChild(createYear);
}
for (let y = 1; y <= 12; y++) {
  let createMonth = document.createElement("option");
  createMonth.value = y;
  createMonth.text = y;
  selectMonthDropDown.appendChild(createMonth);
}document.querySelector(".backArrow").addEventListener("click",()=>{
  location.href = "/login"
})