document
  .querySelector(".registerForm")
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

    const result = await res.json(); // { success: true }

    for (const key in result) {
      document.querySelector(`.${key}`).textContent = result[key];
      let elementBorder = key.split("-");
      const div = document.querySelector(`.${elementBorder[1]}`);
      let borderCheck = false;

      if (!borderCheck) {

        if (result[key] == "") {
          borderCheck = true;
        }
      }

      if(div.style.border.includes("red")){
        continue;
      }
      
      if (borderCheck) {
        div.style.border = "solid 5px green";
      } else {
        div.style.border = "solid 5px red";
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
}
