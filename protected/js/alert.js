script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
document.body.appendChild(script);

function showError({ title, text }) {
  Swal.fire({
    icon: "error",
    title,
    text,
    footer: "try again later",
  });
}
