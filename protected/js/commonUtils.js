async function getuserId() {
  let res = await fetch("/user-id");
  let result = await res.json();
  return result.id;
}

async function getUsername(id) {
  const usernameRes = await fetch(`/usernames/${id}`);
  const usernameResult = await usernameRes.json();

  return usernameResult.username;
}

function clearAllChildNode(parent) {
  while (parent.firstChild) {
    console.log("cleared ", parent.firstChild);
    parent.removeChild(parent.firstChild);
  }
}

async function getProfilePic() {
  const Res = await fetch("/profilePic", {
    method: "POST",
  });
  const Result = await Res.json();
  console.log("Result");
  return Result.profilePic;
}
