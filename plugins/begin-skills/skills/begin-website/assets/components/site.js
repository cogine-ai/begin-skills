// Without JavaScript, keep the sample from submitting visitor input to a URL.
document.querySelector("#sample-form button").disabled = false;
const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
if (menu && navigation) {
  menu.hidden = false;
  navigation.dataset.collapsible = "";
  const close = () => {
    delete navigation.dataset.open;
    menu.setAttribute("aria-expanded", "false");
  };
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    navigation.toggleAttribute("data-open", open);
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const open = menu.getAttribute("aria-expanded") === "true";
      close();
      if (open) menu.focus();
    }
  });
}
const form = document.querySelector("#sample-form");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  let firstInvalid;
  [
    ["sample-name", "name-error", "Enter your name."],
    ["sample-email", "email-error", "Enter a valid email address."],
    [
      "sample-message",
      "message-error",
      "Describe what you would like to make.",
    ],
  ].forEach(([id, errorId, message]) => {
    const field = document.getElementById(id);
    const invalid = !field.value.trim() || !field.validity.valid;
    field.setAttribute("aria-invalid", String(invalid));
    const error = document.getElementById(errorId);
    error.hidden = !invalid;
    error.textContent = invalid ? message : "";
    if (invalid && !firstInvalid) firstInvalid = field;
  });
  const result = document.querySelector("#form-result");
  result.hidden = false;
  if (firstInvalid) {
    result.textContent = "Check the highlighted fields. Nothing has been sent.";
    firstInvalid.focus();
  } else {
    result.textContent =
      "The fields are valid. This sample has no receiving service, so nothing has been sent or saved. Connect a real handler before publishing.";
  }
});
const messages = {
  empty: [
    "No examples selected.",
    "Choose an example or add your own content.",
  ],
  loading: [
    "Sample loading state.",
    "A real request would show this while waiting, with a bounded timeout and useful recovery.",
  ],
  error: [
    "Sample connection error.",
    "Your work is preserved. A real handler should offer a safe retry or another way to continue.",
  ],
  success: [
    "Sample confirmed receipt.",
    "Only show this after the receiving service has actually accepted the result. No request was made here.",
  ],
};
document.querySelectorAll("[data-state]").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll("[data-state]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    const box = document.querySelector("#state-demo");
    const [title, copy] = messages[button.dataset.state];
    box.dataset.state = button.dataset.state;
    box.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = title;
    const p = document.createElement("p");
    p.textContent = copy;
    box.append(strong, p);
  }),
);
const image = document.querySelector("#sample-image");
const fallback = document.querySelector(".image-fallback");
image.addEventListener("error", () => {
  image.hidden = true;
  fallback.hidden = false;
  document.querySelector("#image-status").textContent =
    "The illustration could not load. Its description remains available.";
});
image.addEventListener("load", () => {
  image.hidden = false;
  fallback.hidden = true;
});
document.querySelector("#break-image").addEventListener("click", () => {
  image.src = "intentionally-missing-example.svg";
});
document.querySelector("#restore-image").addEventListener("click", () => {
  image.src = "sample-art.svg";
  document.querySelector("#image-status").textContent =
    "Trying to load the illustration again.";
});
