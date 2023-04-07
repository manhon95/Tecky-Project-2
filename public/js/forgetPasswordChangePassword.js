const newPasswordForm = document.querySelector("#newPasswordForm");


newPasswordForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    newPasswordSubmit.disabled = true;
    const form = event.target;
    let checkStatus = true
    if (form.newPassword.value.length < 8) {
      setPasswordMessage.textContent = "Password must be 8 or more character";
      checkStatus = false;
    } else {
      setPasswordMessage.textContent = "";
    }
    if (form.newPassword.value != form.newPasswordConfirm.value) {
      setPasswordMessage2.textContent ="Confirm password is different";
      checkStatus = false;
    } else {
      setPasswordMessage2.textContent = "";
    }

    if(checkStatus){
    const res = await fetch("/changeForgetPassword", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: form.newPassword.value,
        ConfirmPassword: form.newPasswordConfirm.value,
      }),
    });
    let result = await res.json();
    setPasswordMessage.textContent = result.message
    document.querySelector("#setPasswordMessage2").innerHTML = '<a href="login.html">back to login page</a>'
  }else{
    newPasswordSubmit.disabled = false;
    
  }
  });
  