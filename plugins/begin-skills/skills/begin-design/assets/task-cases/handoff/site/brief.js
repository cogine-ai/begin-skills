"use strict";
(() => {
  const core = window.HandoffBrief;
  const storageKey = "handoff-office-brief-v1";
  const form = document.querySelector("#brief-form");
  const controls = { audience: form.elements.audience, handoffDate: form.elements.handoffDate, problem: form.elements.problem };
  const byId = id => document.getElementById(id);
  let prepared = null;
  let savedSerialized = null;
  let storageMessage = "";
  let restoring = false;
  controls.handoffDate.min = core.currentDate();
  function readInput() {
    return { scope: form.elements.scope.value, audience: controls.audience.value, handoffDate: controls.handoffDate.value, problem: controls.problem.value };
  }
  function writeInput(input) {
    form.elements.scope.value = input.scope;
    Object.keys(controls).forEach(key => { controls[key].value = input[key]; });
  }
  function clearErrors() {
    core.fields.forEach(key => {
      const node = byId(key + "-error");
      node.hidden = true;
      node.textContent = "";
      if (controls[key]) controls[key].removeAttribute("aria-invalid");
    });
    byId("validation-summary").hidden = true;
  }
  function refresh() {
    const current = readInput(), mode = core.state(current, prepared), scope = core.scopes[current.scope];
    const note = byId("scope-note");
    note.querySelector("strong").textContent = scope.label + " includes";
    note.querySelector("p").textContent = scope.includes;
    const status = byId("prepared-state");
    status.dataset.state = mode;
    status.textContent = {empty:"Not prepared", ready:"Ready to use", stale:"Out of date"}[mode];
    byId("state-explanation").textContent = {empty:"Fill in the current input, then prepare your brief.", ready:"This text matches the current input. Copy or download it when you are ready.", stale:"The input has changed. The text below uses the previous basis; prepare again before exporting."}[mode];
    byId("empty-result").hidden = !!prepared;
    byId("prepared-content").hidden = !prepared;
    if (prepared) {
      byId("brief-text").textContent = prepared.text;
      byId("prepared-date").textContent = "Prepared " + new Intl.DateTimeFormat("en-GB", {day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit"}).format(new Date(prepared.preparedAt)) + " · Based on the input at that time";
    }
    byId("copy-brief").disabled = mode !== "ready";
    byId("download-brief").disabled = mode !== "ready";
    const saved = savedSerialized === core.serialize(current, prepared);
    byId("save-status").textContent = storageMessage || (saved ? "Saved locally · Reload restores this version" : savedSerialized ? "Changes not saved locally" : "No local save yet");
  }
  function closeReset() { byId("reset-confirmation").hidden = true; byId("reset").setAttribute("aria-expanded", "false"); }
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const decoded = core.decodeSaved(saved);
      writeInput(decoded.current);
      prepared = decoded.prepared;
      savedSerialized = core.serialize(decoded.current, prepared);
    }
  } catch (error) { storageMessage = "The local save could not be read. Current work can still be prepared and downloaded."; }
  const requestedScope = new URLSearchParams(location.search).get("scope");
  if (requestedScope && Object.hasOwn(core.scopes, requestedScope)) {
    form.elements.scope.value = requestedScope;
    storageMessage = "";
  }
  refresh();
  form.addEventListener("input", () => { if (restoring) return; storageMessage = ""; clearErrors(); byId("export-status").textContent = ""; refresh(); });
  form.addEventListener("change", () => { storageMessage = ""; clearErrors(); byId("export-status").textContent = ""; refresh(); });
  form.addEventListener("submit", event => {
    event.preventDefault();
    clearErrors();
    const result = core.prepare(readInput());
    if (!result.valid) {
      Object.entries(result.errors).forEach(([key, message]) => {
        const node = byId(key + "-error");
        node.textContent = message; node.hidden = false;
        if (controls[key]) controls[key].setAttribute("aria-invalid", "true");
      });
      const summary = byId("validation-summary");
      summary.textContent = "Check the highlighted details, then prepare again.";
      summary.hidden = false;
      const first = Object.keys(result.errors)[0];
      (controls[first] || form.elements.scope[0]).focus();
      refresh();
      return;
    }
    prepared = result.prepared;
    storageMessage = "";
    byId("export-status").textContent = "";
    refresh();
    byId("prepared-title").focus();
  });
  byId("save-local").addEventListener("click", () => {
    const snapshot = core.serialize(readInput(), prepared);
    try { localStorage.setItem(storageKey, snapshot); savedSerialized = snapshot; storageMessage = ""; }
    catch (error) { storageMessage = "Browser storage is unavailable. Keep this page open or download a prepared brief before leaving."; }
    refresh();
  });
  byId("reset").addEventListener("click", () => {
    const open = byId("reset-confirmation").hidden;
    byId("reset-confirmation").hidden = !open;
    byId("reset").setAttribute("aria-expanded", String(open));
    if (open) byId("cancel-reset").focus();
  });
  byId("cancel-reset").addEventListener("click", () => { closeReset(); byId("reset").focus(); });
  byId("confirm-reset").addEventListener("click", () => {
    restoring = true;
    writeInput(core.empty()); prepared = null; savedSerialized = null; storageMessage = "";
    try { localStorage.removeItem(storageKey); } catch (error) { storageMessage = "The brief was cleared on this page, but this browser could not remove its local save."; }
    clearErrors(); closeReset(); byId("export-status").textContent = ""; refresh(); controls.audience.focus(); restoring = false;
  });
  byId("copy-brief").addEventListener("click", async () => {
    if (core.state(readInput(), prepared) !== "ready") return;
    const text = prepared.text;
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      byId("export-status").textContent = core.state(readInput(), prepared) === "ready" && text === prepared.text ? "Brief copied. Nothing was sent." : "The previous prepared brief was copied; the current input has since changed.";
    } catch (error) { byId("export-status").textContent = "Copy is unavailable here. Use Download .txt or select the prepared text."; }
  });
  byId("download-brief").addEventListener("click", () => {
    if (core.state(readInput(), prepared) !== "ready") return;
    const blob = new Blob([prepared.text + "\n"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = "handoff-office-review-brief.txt"; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    byId("export-status").textContent = "Text file download requested. Nothing was sent.";
  });
})();
