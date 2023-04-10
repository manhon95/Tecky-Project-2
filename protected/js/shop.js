const coins = document.querySelector(".coins");
const template = document.querySelector("template");

let myId;

async function init() {
  const socket = io();
  myId = await getuserId();
  showBadges(await getUnboughtBadges(myId));
  coins.textContent = await getCoins(myId);
}

init();

async function getUnboughtBadges(id) {
  let res = await fetch(`/unboughtBadges/${id}`);
  let result = await res.json();
  let badges = result.badges;
  return badges;
}
function showBadges(badges) {
  const badgeList = document.querySelector(".badge-list");
  clearAllChildNode(badgeList);
  // clearAllChildNode(badgeList);
  const badgeTemplate = template.content.querySelector(".badge");

  badges.map((badge) => {
    const badgeNode = badgeTemplate.cloneNode(true);

    badgeNode.querySelector(".badge-name").textContent = badge.name;
    badgeNode.querySelector(".badge-image").src = badge.url;
    badgeNode.querySelector(".badge-price").textContent = `$${badge.price}`;
    badgeNode.querySelector(".buy-btn").addEventListener("click", async () => {
      // console.log("tries to post");
      let res = await fetch(`/users/${myId}/badges/${badge.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      let result = await res.json();
      // console.log(result);
      if (result.error) {
        showError({ title: "Can't Purchase", text: result.error });
        return;
      }
      showSuccess({
        title: "Finish buy",
        text: `You have purchased ${badge.name}`,
      });
      // update again coins and list;
      showBadges(await getUnboughtBadges(myId));
      coins.textContent = await getCoins(myId);
    });
    badgeList.appendChild(badgeNode);
  });
}
async function getCoins(userId) {
  let res = await fetch(`/coins/${userId}`);
  let result = await res.json();
  let coins = result;

  return coins;
}
