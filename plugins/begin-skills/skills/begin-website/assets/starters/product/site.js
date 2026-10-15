// Enable the local interaction only after its event handling is available.
document.querySelector("#add-task button").disabled = false;
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
    if (
      event.key === "Escape" &&
      menu.getAttribute("aria-expanded") === "true"
    ) {
      close();
      menu.focus();
    }
  });
  matchMedia("(min-width: 681px)").addEventListener("change", close);
}
const list = document.querySelector("#task-list");
const status = document.querySelector("#board-status");
const initialTasks = [
  { text: "Write a clear introduction", bucket: "today" },
  { text: "Make a first version", bucket: "today" },
  { text: "Explore another direction", bucket: "later" },
];
let view = "today";
function update(message = "") {
  const tasks = [...list.querySelectorAll("[data-task]")];
  tasks.forEach((task) => {
    task.hidden = task.dataset.bucket !== view;
    const text = task.querySelector("label span").textContent;
    const target = task.dataset.bucket === "today" ? "Later" : "Today";
    const move = task.querySelector("[data-move]");
    move.textContent = `${target} ${target === "Later" ? "↗" : "↙"}`;
    move.setAttribute("aria-label", `Move ${text} to ${target}`);
  });
  const visible = tasks.filter((task) => !task.hidden);
  const complete = visible.filter(
    (task) => task.querySelector("input").checked,
  ).length;
  document.querySelector("#empty-state").hidden = visible.length !== 0;
  status.textContent = `${message ? `${message} ` : ""}${visible.length} ${visible.length === 1 ? "task" : "tasks"} in ${view === "today" ? "Today" : "Later"}. ${complete} complete.`;
}
function addTask(text, bucket) {
  const task = document.createElement("li");
  task.dataset.task = "";
  task.dataset.bucket = bucket;
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  const span = document.createElement("span");
  span.textContent = text;
  label.append(checkbox, span);
  const move = document.createElement("button");
  move.type = "button";
  move.dataset.move = "";
  task.append(label, move);
  list.append(task);
  return task;
}
document.querySelectorAll("[data-view]").forEach((button) =>
  button.addEventListener("click", () => {
    view = button.dataset.view;
    document
      .querySelectorAll("[data-view]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    update();
  }),
);
list.addEventListener("change", (event) => {
  if (event.target.matches("input[type=checkbox]"))
    update(
      event.target.checked
        ? "Task marked complete."
        : "Task marked incomplete.",
    );
});
list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-move]");
  if (!button) return;
  const task = button.closest("[data-task]");
  task.dataset.bucket = task.dataset.bucket === "today" ? "later" : "today";
  update("Task moved.");
  document.querySelector(`[data-view="${view}"]`).focus();
});
document.querySelector("#add-task").addEventListener("submit", (event) => {
  event.preventDefault();
  const field = document.querySelector("#new-task");
  const text = field.value.trim();
  if (!text) {
    field.setCustomValidity("Write a task before adding it.");
    field.reportValidity();
    return;
  }
  field.setCustomValidity("");
  addTask(text, view);
  field.value = "";
  update("Task added.");
  field.focus();
});
document
  .querySelector("#new-task")
  .addEventListener("input", (event) => event.target.setCustomValidity(""));
document.querySelector("#reset-board").addEventListener("click", () => {
  list.replaceChildren();
  initialTasks.forEach((task) => addTask(task.text, task.bucket));
  view = "today";
  document
    .querySelectorAll("[data-view]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.view === view)),
    );
  document.querySelector("#new-task").value = "";
  update("Demo reset.");
});
update();
