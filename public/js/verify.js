document.querySelector("#submitForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;

    const res = await fetch("/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({code: form.verificationCode.value}),
    });
    const result = await res.json()
    console.log(result)
    if(result.message){
        location.href = "/user/lobby"
    }else{
    document.querySelector("#message").textContent = result.message;
    }
})