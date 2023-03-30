async function getUserId() {
  let res = await fetch("/user-id");
  let result = await res.json();
  return result.id;
}

async function getUsername() {
  const usernameRes = await fetch("/username");
  const usernameResult = await usernameRes.json();

  return usernameResult.username;
}

function clearAllChildNode(parent) {
  while (parent.firstChild) {
    console.log("cleared ", parent.firstChild);
    parent.removeChild(parent.firstChild);
  }
}
