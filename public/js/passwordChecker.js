     async function alert(){
 
    const res = await fetch("/register", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await res.json(); 
    console.log("result");
    console.log(result)
  }
  alert()
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
      location.href = "/gameroom";
    }
  });
