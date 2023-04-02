const username = document.querySelector(".username");
const coins = document.querySelector(".coins");
const template = document.querySelector("template");

async function init() {
  const socket = io();
  let myId = await getUserId();
  let myName = await getUsername(myId);
  let myCoins = await getCoins(myId);
  let badges = await getUnboughtBadges(myId);
  showBadges(badges);
  username.textContent = myName;
  coins.textContent = myCoins;
}

init();

async function getUnboughtBadges(id) {
  let res = await fetch(`/unboughtBadges/${id}`);
  let result = await res.json();
  let badges = result.badges;
  return badges;
}
function showBadges(badges) {
  let badgeList = document.querySelector(".badge-list");
  // clearAllChildNode(badgeList);
  let badgeTemplate = template.content.querySelector(".badge");

  badges.map((badge) => {
    let badgeNode = badgeTemplate.cloneNode(true);

    badgeNode.querySelector(".badge-name").textContent = badge.name;
    badgeNode.querySelector(".badge-image").src = badge.url;
    badgeNode.querySelector(".badge-price").textContent = badge.price;
    badgeList.appendChild(badgeNode);
  });
}
async function getCoins(userId) {
  let res = await fetch(`/coins/${userId}`);
  let result = await res.json();
  let coins = result.coins;

  return coins;
}
