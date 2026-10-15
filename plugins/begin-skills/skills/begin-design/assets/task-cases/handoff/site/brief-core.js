(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HandoffBrief = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const scopes = {
    "document-review": { label: "Guide review", includes: "An annotated draft, open questions, and revised instructions for the agreed section.", outputs: ["Annotated draft", "Questions for the product team to resolve", "Revised instructions for the agreed section"] },
    "support-handoff": { label: "Support handoff", includes: "A support procedure, an escalation checklist, and open decisions with named owners.", outputs: ["Support procedure for the agreed diagnostic task", "Escalation checklist", "Open decisions with named owners"] }
  };
  const fields = ["scope", "audience", "handoffDate", "problem"];
  function empty() { return { scope: "document-review", audience: "", handoffDate: "", problem: "" }; }
  function currentDate(date = new Date()) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }
  function normalize(input) { return Object.fromEntries(fields.map(key => [key, String(input[key] || "").trim()])); }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + "T12:00:00Z");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function wordCount(value) { return (value.match(/[\p{L}\p{N}]+/gu) || []).length; }
  function validate(input, today = currentDate()) {
    const value = normalize(input), errors = {};
    if (!Object.hasOwn(scopes, value.scope)) errors.scope = "Choose Guide review or Support handoff.";
    if (value.audience.length < 8 || wordCount(value.audience) < 2) errors.audience = "Name an audience in at least 8 characters and 2 words.";
    else if (value.audience.length > 200) errors.audience = "Keep the audience to 200 characters or fewer.";
    if (!validDate(value.handoffDate)) errors.handoffDate = "Choose a valid intended handoff date.";
    else if (value.handoffDate < today) errors.handoffDate = "Choose today or a future intended handoff date.";
    if (value.problem.length < 24 || wordCount(value.problem) < 5) errors.problem = "Describe the current problem in at least 24 characters and 5 words.";
    else if (value.problem.length > 2000) errors.problem = "Keep the problem to 2,000 characters or fewer.";
    return { value, errors, valid: Object.keys(errors).length === 0 };
  }
  function formatDate(value) {
    return new Intl.DateTimeFormat("en-GB", {day:"numeric", month:"long", year:"numeric", timeZone:"UTC"}).format(new Date(value + "T12:00:00Z"));
  }
  function summary(input) {
    const value = normalize(input), scope = scopes[value.scope];
    if (!scope || !validDate(value.handoffDate)) throw new Error("The brief has an invalid scope or date.");
    return ["HANDOFF OFFICE — REVIEW BRIEF", "Fictional service example; prepared locally, not sent.", "", "Scope: " + scope.label + (value.scope === "document-review" ? " (document review)" : ""), "Audience: " + value.audience, "Intended handoff date: " + formatDate(value.handoffDate), "", "Current problem:", value.problem, "", "Proposed outputs:", ...scope.outputs.map(output => "- " + output), "", "To agree before work begins:", "The document or task, the boundaries of the review, the delivery date, and who will confirm product behavior.", "", "This brief does not confirm a booking or delivery date."].join("\n");
  }
  function prepare(input, options = {}) {
    const result = validate(input, options.today);
    if (!result.valid) return { ...result, prepared: null };
    const basis = Object.fromEntries(fields.map(key => [key, String(input[key] || "")]));
    return { ...result, prepared: { basis, text: summary(basis), preparedAt: options.preparedAt || new Date().toISOString() } };
  }
  function sameInput(a, b) { return fields.every(key => a[key] === b[key]); }
  function state(current, prepared) { return !prepared ? "empty" : sameInput(current, prepared.basis) ? "ready" : "stale"; }
  function decodeSaved(raw) {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || !value.current || !fields.every(key => typeof value.current[key] === "string")) throw new Error("Saved input is not supported.");
    if (!Object.hasOwn(scopes, value.current.scope) || value.current.audience.length > 200 || value.current.problem.length > 2000) throw new Error("Saved input is outside its limits.");
    if (value.prepared) {
      const item = value.prepared;
      if (!item.basis || !fields.every(key => typeof item.basis[key] === "string") || typeof item.preparedAt !== "string" || !Number.isFinite(new Date(item.preparedAt).getTime())) throw new Error("The saved prepared brief is incomplete.");
      if (!validate(item.basis, "0000-01-01").valid || item.text !== summary(item.basis)) throw new Error("The saved prepared brief does not match its basis.");
    }
    return { version: 1, current: value.current, prepared: value.prepared || null };
  }
  function serialize(current, prepared) { return JSON.stringify({ version: 1, current, prepared }); }
  return { scopes, fields, empty, currentDate, normalize, validate, formatDate, summary, prepare, sameInput, state, decodeSaved, serialize };
});
