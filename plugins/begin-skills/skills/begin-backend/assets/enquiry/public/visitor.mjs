const form = document.querySelector("#enquiry-form");
const recipient = document.querySelector("#recipient");
const button = document.querySelector("#submit");
const status = document.querySelector("#form-status");
let requestKey = crypto.randomUUID();

function announce(message, state) {
  status.textContent = message;
  status.dataset.state = state;
}
function clearErrors() {
  for (const name of ["name", "email", "message"]) {
    const input = form.elements[name];
    input.removeAttribute("aria-invalid");
    input.setAttribute(
      "aria-describedby",
      name === "message" ? "message-hint" : "",
    );
    document.getElementById(`${name}-error`).hidden = true;
  }
}
async function loadSites() {
  try {
    const response = await fetch("/api/sites");
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error?.message ?? "Local sites could not be loaded.",
      );
    recipient.replaceChildren();
    for (const site of result.sites) {
      const option = document.createElement("option");
      option.value = site.slug;
      option.textContent = site.displayName;
      recipient.append(option);
    }
    const slug = /^\/s\/([a-z0-9-]+)$/.exec(location.pathname)?.[1];
    if (slug && [...recipient.options].some((option) => option.value === slug))
      recipient.value = slug;
    if (!recipient.value)
      throw new Error(
        "No local owner is configured. Follow the setup instructions.",
      );
    recipient.disabled = false;
    button.disabled = false;
  } catch {
    announce(
      "The local service could not load its sites. Keep this page open, restart the service, then reload.",
      "error",
    );
  }
}
form.addEventListener("input", () => {
  requestKey = crypto.randomUUID();
});
recipient.addEventListener("change", () => {
  requestKey = crypto.randomUUID();
});
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();
  if (!form.reportValidity()) return;
  recipient.disabled = true;
  for (const name of ["name", "email", "message"])
    form.elements[name].readOnly = true;
  button.disabled = true;
  button.textContent = "Saving your enquiry…";
  announce("Saving to the local database…", "pending");
  try {
    const response = await fetch(
      `/api/sites/${encodeURIComponent(recipient.value)}/enquiries`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestKey,
        },
        body: JSON.stringify({
          name: form.elements.name.value,
          email: form.elements.email.value,
          message: form.elements.message.value,
        }),
      },
    );
    const result = await response.json();
    if (!response.ok) {
      for (const [name, message] of Object.entries(
        result.error?.fields ?? {},
      )) {
        const input = form.elements[name],
          error = document.getElementById(`${name}-error`);
        if (!input || !error) continue;
        input.setAttribute("aria-invalid", "true");
        input.setAttribute(
          "aria-describedby",
          `${name === "message" ? "message-hint " : ""}${name}-error`,
        );
        error.textContent = message;
        error.hidden = false;
      }
      announce(
        result.error?.message ??
          "Your enquiry could not be saved. Keep your text and try again.",
        "error",
      );
      const invalid = form.querySelector("[aria-invalid=true]");
      (invalid ?? status).focus();
      return;
    }
    announce(
      "Saved for this website owner. This local example sends no email. You can view the message in the matching owner inbox.",
      "success",
    );
    form.elements.name.value = "";
    form.elements.email.value = "";
    form.elements.message.value = "";
    requestKey = crypto.randomUUID();
    status.focus();
  } catch {
    announce(
      "The service could not confirm the save. Your text is still here. Restart the service and retry the unchanged message; the request key prevents a duplicate.",
      "error",
    );
    status.focus();
  } finally {
    recipient.disabled = false;
    for (const name of ["name", "email", "message"])
      form.elements[name].readOnly = false;
    button.disabled = false;
    button.textContent = "Save your enquiry →";
  }
});
await loadSites();
