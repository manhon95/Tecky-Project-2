

document
  .querySelector(".loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;
    const formObject = {};

    formObject["email"] = form.email.value;
    formObject["password"] = form.password.value;
    formObject["errorMessage"] = ""
    const res = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      }, 
      body: JSON.stringify(formObject),
    });

    const result = await res.json(); // { success: true }
    document.querySelector(".wrongPasswordMessage").textContent = result.error
  });

document.querySelector(".registerForm").addEventListener("submit", async (event)=>{
event.preventDefault()
const form = event.target
const formObject = {}

formObject["Title"] = req.body.Title;
formObject["firstName"] = req.body.firstName;
formObject["lastName"] = req.body.lastName;
formObject["monthOfBirth"] = req.body.monthOfBirth;
formObject["yearOfBirth"] = req.body.yearOfBirth;
formObject["email"] = req.body.email;
formObject["password"] = req.body.password;
formObject["confirmPassword"] = req.body.confirmPassword;

const res = await fetch("/register", {
  method: "post",
  headers: {
    "Content/type":"application/json",
  },
  body: JSON.stringify(formObject),
})

})