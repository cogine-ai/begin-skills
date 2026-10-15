const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
if (menu && navigation) {
  menu.hidden = false;
  navigation.dataset.collapsible = "";
  const closeMenu = () => {
    delete navigation.dataset.open;
    menu.setAttribute("aria-expanded", "false");
  };
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    navigation.toggleAttribute("data-open", open);
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menu.focus();
    }
  });
  matchMedia("(min-width: 741px)").addEventListener("change", closeMenu);
}

const choices = document.querySelector(".work-choices");
if (choices) {
  const buttons = [...choices.querySelectorAll("button[data-work]")];
  const panels = buttons.map((button) => document.getElementById(button.dataset.work));
  if (buttons.length && panels.every(Boolean)) {
    choices.hidden = false;
    choices.setAttribute("role", "tablist");
    const status = document.querySelector("#work-status");
    const choose = (index, announce = true) => {
      buttons.forEach((button, item) => {
        const selected = item === index;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
        panels[item].hidden = !selected;
      });
      if (announce && status) {
        status.textContent = `Showing ${panels[index].querySelector("h3").textContent.trim()}, a self-initiated concept.`;
      }
    };
    buttons.forEach((button, index) => {
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", panels[index].id);
      panels[index].setAttribute("role", "tabpanel");
      panels[index].setAttribute("aria-labelledby", button.id);
      panels[index].tabIndex = 0;
      button.addEventListener("click", () => choose(index));
      button.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
        if (event.key === "ArrowLeft") next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = buttons.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        choose(next);
        buttons[next].focus();
      });
    });
    choose(0, false);
  }
}

document.querySelectorAll("[data-image-frame] img").forEach((image) => {
  const recover = () => {
    image.hidden = true;
    image.parentElement.dataset.imageFailed = "";
    const fallback = image.parentElement.querySelector(".image-fallback");
    if (fallback) fallback.hidden = false;
  };
  image.addEventListener("error", recover);
  if (image.complete && image.naturalWidth === 0) recover();
});
