export const WORKS = [
  {
    "id": "low-tide-choir",
    "title": "Low Tide Choir",
    "artist": "Marin Vale",
    "place": "East Jetty",
    "minutes": 25,
    "access": "Outdoor sound walk; level route",
    "kind": "Sound / outside",
    "description": "A sound walk along the jetty. Give the work time, then leave room in your evening to linger by the water."
  },
  {
    "id": "paper-sun",
    "title": "Paper Sun",
    "artist": "Éloïse Chen",
    "place": "Warehouse 2",
    "minutes": 18,
    "access": "Indoor projection; seated space",
    "kind": "Projection / inside",
    "description": "A study of projected light inside Warehouse 2. A seated space makes this a place to pause within your evening."
  },
  {
    "id": "signal-garden",
    "title": "Signal Garden",
    "artist": "Noor Okafor",
    "place": "Crane Court",
    "minutes": 12,
    "access": "Outdoor light field; step-free",
    "kind": "Light / outside",
    "description": "An outdoor light field in Crane Court. Add a short stop here between the longer indoor installations."
  },
  {
    "id": "a-room-for-echoes",
    "title": "A Room for Echoes",
    "artist": "Ada Sørensen",
    "place": "Pump House",
    "minutes": 20,
    "access": "Indoor sound; quiet session available",
    "kind": "Sound / inside",
    "description": "An indoor sound work in the Pump House. A quiet session is available; keep this access note with your plan."
  },
  {
    "id": "after-the-rain",
    "title": "After the Rain",
    "artist": "Tomás Reyes",
    "place": "North Basin",
    "minutes": 15,
    "access": "Outdoor reflection; waterside barrier",
    "kind": "Reflection / outside",
    "description": "A reflection work at the North Basin. This is a waterside installation with a barrier; take time to read its setting."
  },
  {
    "id": "soft-machines",
    "title": "Soft Machines",
    "artist": "Jun Park",
    "place": "Workshop 4",
    "minutes": 30,
    "access": "Indoor kinetic installation; step-free",
    "kind": "Kinetic / inside",
    "description": "A kinetic installation inside Workshop 4. Its thirty-minute estimate is the longest in the programme; leave it the space it needs."
  }
];
export const DAYS = Object.freeze({
  "2027-03-19": "Friday 19 March 2027",
  "2027-03-20": "Saturday 20 March 2027",
  "2027-03-21": "Sunday 21 March 2027"
});
export function blankPlan() { return { version: 1, day: "2027-03-19", selected: [] }; }
export function parsePlan(raw) {
  const value = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 1 ||
      typeof value.day !== "string" || !Object.hasOwn(DAYS, value.day) || !Array.isArray(value.selected) || value.selected.length > WORKS.length ||
      value.selected.some(id => typeof id !== "string" || !WORKS.some(work => work.id === id)) ||
      new Set(value.selected).size !== value.selected.length) throw new Error("Invalid saved plan");
  return {version: 1, day: value.day, selected: [...value.selected]};
}
export function chosenWorks(plan) { return WORKS.filter(work => plan.selected.includes(work.id)); }
export function totalMinutes(plan) { return chosenWorks(plan).reduce((sum, work) => sum + work.minutes, 0); }
export function exportPlan(plan) {
  const works = chosenWorks(plan);
  if (!works.length) throw new Error("Add an installation before downloading a plan");
  return [
    "AFTERIMAGE — MY EVENING PLAN", "", DAYS[plan.day], "Bellweather Dock", "Open 18:00–23:00", "",
    ...works.flatMap((work, index) => [`${index + 1}. ${work.title}`, `Artist: ${work.artist}`, `Place: ${work.place}`, `Estimated duration: ${work.minutes} min`, `Access: ${work.access}`, ""]),
    `Total estimated installation time: ${totalMinutes(plan)} min`,
    `${works.length} of 6 installations selected`, "",
    "All installations can be visited during the evening. Durations are planning estimates, not booked appointment times.",
    "The total includes installation estimates only. Allow additional time to move between works, rest and explore.",
    "Your chosen works are listed in programme order; this is not a timed or geographic route.", "",
    "Fictional local example. This plan is not a ticket or booking. Nothing has been sent to an event organiser.", ""
  ].join("\n");
}
