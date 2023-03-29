script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
document.body.appendChild(script);

function showError({ title, text }) {
  Swal.fire({
    icon: "error",
    title,
    text,
  });
}

function showSuccess({ title, text }) {
  Swal.fire({
    icon: "success",
    title,
    text,
  });
}
