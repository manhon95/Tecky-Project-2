
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
