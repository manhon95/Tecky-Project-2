document.querySelector("#submitForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;

    const res = await fetch("/forgetPasswordVerify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({code: form.verificationCode.value}),
    });
    const result = await res.json()
    if(result.pass){
        location.href = "/forgetPasswordChangePassword.html"
    }else{
    document.querySelector("#message").textContent = result.message;
    }
})