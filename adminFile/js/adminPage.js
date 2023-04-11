const template = document.querySelector("template")
const userDetailsList = document.querySelector(".userDetails-list")
const searchUserButton = document.querySelector("#searchUserButton")
const changeCoinsAmountButton = document.querySelector("#changeCoinsAmountButton")
const verificationButton = document.querySelector("#verificationButton")
const searchUserForm = document.querySelector("#searchUserForm")
const changeCoinsAmountForm = document.querySelector("#changeCoinsAmountForm")
const verificationForm = document.querySelector("#verificationForm")
const userDetails = template.content.querySelector(".userDetails").cloneNode(true);
const message = document.querySelector("#message")

back.addEventListener("click", ()=>{
  verificationButton.classList.remove("hidden")
  changeCoinsAmountButton.classList.remove("hidden")
  searchUserButton.classList.remove("hidden")
  verificationForm.classList = "hidden"
  changeCoinsAmountForm.classList = "hidden"
  searchUserForm.classList = "hidden"
 })
searchUserButton.addEventListener("click", ()=>{ 
  searchUserForm.classList.remove("hidden")
  verificationForm.classList = "hidden"
  changeCoinsAmountForm.classList = "hidden"
})
changeCoinsAmountButton.addEventListener("click", ()=>{ 
  changeCoinsAmountForm.classList.remove("hidden")
  verificationForm.classList = "hidden"
  searchUserForm.classList = "hidden"

})
verificationButton.addEventListener("click", ()=>{ 
  verificationForm.classList.remove("hidden")
  changeCoinsAmountForm.classList = "hidden"
  searchUserForm.classList = "hidden"


})

searchUserForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;
    const formObject = {};

    formObject["email"] = form.email.value;
    const res = await fetch("/searchUserForm", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formObject),
    });
    const result = await res.json();
    while(userDetailsList.firstChild) {
      console.log("clear");
      userDetailsList.removeChild(userDetailsList.firstChild);
    }
    result.map(account => {
      const userDetails = template.content.querySelector(".userDetails").cloneNode(true);
      userDetails.querySelector(".id").textContent = account.id
      userDetails.querySelector(".userName").textContent = account.elo
      userDetails.querySelector(".email").textContent = account.email
      userDetails.querySelector(".coins").textContent = account.coins
      userDetails.querySelector(".elo").textContent = account.elo
      userDetails.querySelector(".emailVerification").textContent = account.emailVerification
      userDetailsList.appendChild(userDetails);
      })
  

      //  userDetails.querySelector(".id").textContent = result.id
      //  userDetails.querySelector(".userName").textContent = result.elo
      //  userDetails.querySelector(".email").textContent = result.email
      //  userDetails.querySelector(".coins").textContent = result.coins
      //  userDetails.querySelector(".elo").textContent = result.elo
      //  userDetails.querySelector(".emailVerification").textContent = result.emailVerification
      //  userDetailsList.appendChild(userDetails);
  });

  changeCoinsAmountForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;
    const formObject = {};

    formObject["coins"] = form.coins.value;
    formObject["email"] = form.email.value
    const res = await fetch("/changeCoinsAmountForm", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formObject),
    });
    const result = await res.json();
    userDetails.querySelector(".id").textContent = result.id
    userDetails.querySelector(".userName").textContent = result.elo
    userDetails.querySelector(".email").textContent = result.email
    userDetails.querySelector(".coins").textContent = result.coins
    userDetails.querySelector(".elo").textContent = result.elo
    userDetails.querySelector(".emailVerification").textContent = result.emailVerification
    userDetailsList.appendChild(userDetails);
    message.textContent = result.message

  });

  verificationForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;
    const formObject = {};

    formObject["verification"] = form.verification.value;
    formObject["email"] = form.email.value
    const res = await fetch("/verificationForm", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formObject),
    });
    const result = await res.json();
    userDetails.querySelector(".id").textContent = result.id
    userDetails.querySelector(".userName").textContent = result.elo
    userDetails.querySelector(".email").textContent = result.email
    userDetails.querySelector(".coins").textContent = result.coins
    userDetails.querySelector(".elo").textContent = result.elo
    userDetails.querySelector(".emailVerification").textContent = result.emailVerification
    userDetailsList.appendChild(userDetails);
    message.textContent = result.message

  });

