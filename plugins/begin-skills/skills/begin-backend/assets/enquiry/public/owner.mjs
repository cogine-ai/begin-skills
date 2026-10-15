const loginPanel = document.querySelector("#login-panel"),
  inboxPanel = document.querySelector("#inbox-panel");
const form = document.querySelector("#login-form"),
  status = document.querySelector("#owner-status");
const loginButton = document.querySelector("#login-button"),
  refreshButton = document.querySelector("#refresh"),
  logoutButton = document.querySelector("#logout");
let session;

function announce(message, state) {
  status.textContent = message;
  status.dataset.state = state;
}
function showLogin() {
  session = undefined;
  loginPanel.hidden = false;
  inboxPanel.hidden = true;
  document.querySelector("#enquiries").replaceChildren();
}
function showInbox(value) {
  session = value;
  loginPanel.hidden = true;
  inboxPanel.hidden = false;
  document.querySelector("#inbox-title").textContent = value.owner.displayName;
}
async function request(path, options) {
  let response, value;
  try {
    response = await fetch(path, options);
    value = await response.json();
  } catch {
    throw new Error(
      "The local service is unavailable. Restart it and try again; saved enquiries remain in the database.",
    );
  }
  if (!response.ok) {
    const error = new Error(
      value.error?.message ?? "The local request failed.",
    );
    error.status = response.status;
    throw error;
  }
  return value;
}
async function loadEnquiries() {
  refreshButton.disabled = true;
  try {
    const value = await request("/api/owner/enquiries");
    const container = document.querySelector("#enquiries");
    container.replaceChildren();
    if (!value.enquiries.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent =
        "Your inbox is ready. Submit a synthetic enquiry to this site from the visitor form, then refresh.";
      container.append(empty);
    }
    for (const enquiry of value.enquiries) {
      const card = document.createElement("article");
      card.className = "enquiry-card";
      const meta = document.createElement("div");
      meta.className = "enquiry-meta";
      const person = document.createElement("div");
      const name = document.createElement("h3");
      name.textContent = enquiry.name;
      const email = document.createElement("a");
      email.textContent = enquiry.email;
      email.href = `mailto:${encodeURIComponent(enquiry.email)}`;
      const time = document.createElement("time");
      time.dateTime = enquiry.createdAt;
      time.textContent = new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(enquiry.createdAt));
      const message = document.createElement("p");
      message.className = "message";
      message.textContent = enquiry.message;
      person.append(name, email);
      meta.append(person, time);
      card.append(meta, message);
      container.append(card);
    }
    announce(
      `${value.enquiries.length} ${value.enquiries.length === 1 ? "enquiry" : "enquiries"} shown for your site.`,
      "success",
    );
  } catch (error) {
    if (error.status === 401) {
      showLogin();
      announce("Your session ended. Sign in again to continue.", "error");
    } else
      announce(
        error.message ||
          "The local service is unavailable. Restart it and refresh; your messages remain in the database.",
        "error",
      );
  } finally {
    refreshButton.disabled = false;
  }
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  loginButton.disabled = true;
  loginButton.textContent = "Signing in…";
  try {
    const value = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.elements.username.value,
        password: form.elements.password.value,
      }),
    });
    form.elements.password.value = "";
    showInbox(value);
    await loadEnquiries();
  } catch (error) {
    announce(
      error.message ||
        "The local service is unavailable. Restart it and try again.",
      "error",
    );
    status.focus();
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Sign in →";
  }
});
refreshButton.addEventListener("click", loadEnquiries);
logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try {
    await request("/api/auth/logout", {
      method: "POST",
      headers: { "X-CSRF-Token": session.csrfToken },
    });
    showLogin();
    announce("Signed out. Your enquiries remain saved.", "success");
    form.elements.username.focus();
  } catch (error) {
    if (error.status === 401) showLogin();
    announce(
      error.message || "The service is unavailable. Restart it and try again.",
      "error",
    );
  } finally {
    logoutButton.disabled = false;
  }
});
try {
  showInbox(await request("/api/session"));
  await loadEnquiries();
} catch (error) {
  showLogin();
  if (error.status !== 401)
    announce(
      error.message ||
        "The local service is unavailable. Restart it and reload.",
      "error",
    );
}
