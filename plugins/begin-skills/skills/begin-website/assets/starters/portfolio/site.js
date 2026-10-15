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
  matchMedia("(min-width: 601px)").addEventListener("change", close);
}
const projects = [...document.querySelectorAll(".project[data-category]")];
const filters = document.querySelector(".filters");
if (filters) {
  filters.hidden = false;
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    const filter = button.dataset.filter;
    filters
      .querySelectorAll("button")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    projects.forEach((project) => {
      project.hidden = filter !== "all" && project.dataset.category !== filter;
    });
    document
      .querySelector(".gallery")
      .toggleAttribute("data-filtered", filter !== "all");
    const count = projects.filter((project) => !project.hidden).length;
    document.querySelector("#filter-status").textContent =
      `${count} projects shown.`;
  });
}
const dialog = document.querySelector(".lightbox");
const image = document.querySelector("#lightbox-image");
const galleryLinks = [...document.querySelectorAll("[data-gallery]")];
let activeIndex = 0;
let opener;
function visibleGalleryLinks() {
  return galleryLinks.filter((link) => !link.closest(".project").hidden);
}
function showProject(index) {
  const visibleLinks = visibleGalleryLinks();
  activeIndex = (index + visibleLinks.length) % visibleLinks.length;
  const link = visibleLinks[activeIndex];
  image.hidden = false;
  document.querySelector(".lightbox-fallback").hidden = true;
  image.src = link.href;
  image.alt = link.querySelector("img").alt;
  document.querySelector("#lightbox-title").textContent = link.dataset.title;
  document.querySelector("#lightbox-caption").textContent =
    link.dataset.caption;
}
if (dialog && typeof dialog.showModal === "function") {
  galleryLinks.forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      opener = link;
      showProject(visibleGalleryLinks().indexOf(link));
      dialog.showModal();
      document.querySelector(".lightbox-close").focus();
    }),
  );
  document
    .querySelector(".lightbox-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    if (opener) opener.focus();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    }
  });
  document
    .querySelector("[data-gallery-previous]")
    .addEventListener("click", () => showProject(activeIndex - 1));
  document
    .querySelector("[data-gallery-next]")
    .addEventListener("click", () => showProject(activeIndex + 1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showProject(activeIndex + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showProject(activeIndex - 1);
    }
  });
  image.addEventListener("error", () => {
    image.hidden = true;
    document.querySelector(".lightbox-fallback").hidden = false;
  });
}
galleryLinks.forEach((link) => {
  const thumbnail = link.querySelector("img");
  const recover = () => {
    thumbnail.hidden = true;
    link.querySelector(".art-fallback").hidden = false;
  };
  thumbnail.addEventListener("error", recover);
  if (thumbnail.complete && thumbnail.naturalWidth === 0) recover();
});
