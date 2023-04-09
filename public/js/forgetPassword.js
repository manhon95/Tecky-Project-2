const message = document.querySelector("#message")
const submit = document.querySelector("#submit")

document
  .querySelector("#submitForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    submit.setAttribute("disabled", true)
    const form = event.target;
    const formObject = {};

    formObject["email"] = form.email.value;
    const res = await fetch("forgetPasswordEmail", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formObject),
    });

    const result = await res.json(); // { error: string|undefined }
    if (result.verify) {
        location.href = "forgetPasswordVerify.html";
        submit.removeAttribute("disabled")
    } else {
        message.textContent = "No email fount"
        submit.removeAttribute("disabled")
    }
  });
