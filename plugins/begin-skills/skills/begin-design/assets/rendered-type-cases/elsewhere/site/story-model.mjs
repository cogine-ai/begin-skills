export const STORY = Object.freeze({
  arrival: {
    title: 'A station in the rain',
    kind: 'scene',
    paragraphs: [
      'The station arrives between two drops of rain. A moment ago there was a boarded shop on this street; now an iron canopy leans over the pavement, and a lamp paints a small gold circle around your shoes. You are Inez Vale, who has spent thirty years returning other people’s letters. Tonight you have found a parcel of your own.',
      'It waits on a bench at Platform Seven, tied with the green string your father used for everything. The address reads: Inez Vale, when she is ready. Beneath it, in his careful handwriting: Please do not let your mother wait another hour. He vanished in a flood when you were nine. Somewhere inside the parcel, a clock begins to tick. The ticket office is lit. Above the platform, the station clock has no minute hand.'
    ],
    choices: [
      { label: 'Ask at the ticket office', to: 'office' },
      { label: 'Follow the clock’s missing minute', to: 'clock' }
    ]
  },
  office: {
    title: 'The unclaimed window',
    kind: 'scene',
    paragraphs: [
      'The clerk’s window is clouded from the inside. A woman clears a circle with her sleeve and looks at the parcel rather than at you. “Late,” she says. Then, after checking a ticket with no date, “But not too late.” On her desk, a cup of tea gives off the smell of your childhood kitchen.',
      'You ask whether she knew your father. She slides a brass key beneath the glass. “I know what he was carrying. The night the river broke its banks, he put this parcel into a courier’s hands. Then he went back for someone.” Your mother had waited at the kitchen table until the lamp burned out. Nobody ever told her about a courier. The clerk points to a ledger at the end of the counter, then to a pale figure crossing the footbridge. “An entry tells you where. A witness tells you why.”'
    ],
    choices: [
      { label: 'Find the parcel’s entry in the ledger', to: 'ledger' },
      { label: 'Find the courier on the footbridge', to: 'bridge' }
    ]
  },
  clock: {
    title: 'A minute held open',
    kind: 'scene',
    paragraphs: [
      'Under the clock, the rain falls upward. Each drop returns to the canopy with a tiny click, like a typewriter correcting its own sentence. You set the parcel against your ear. Inside, someone is drawing breath to speak. You know that breath: your father always paused before saying anything important.',
      'A porter with wet silver eyebrows opens the clock’s little door. Its minute hand lies inside, wrapped in a handkerchief. “This station holds the time between meaning something and saying it,” he tells you. “Some people leave a great deal behind.” He offers you the hand, but you keep your palms closed. A whistle sounds on the footbridge. Below the clock, a board of names begins to turn, replacing destinations with addresses. Your name appears beneath another: Mara Vale, kitchen window, the night of the flood. Your mother’s name has not faded.'
    ],
    choices: [
      { label: 'Follow the whistle over the footbridge', to: 'bridge' },
      { label: 'Read the names below the clock', to: 'ledger' }
    ]
  },
  ledger: {
    title: 'The address beneath yours',
    kind: 'scene',
    paragraphs: [
      'The ledger is open to a page soft as a moth’s wing. Your father’s name occupies one line. Beside it: Passenger remained behind to lift the sluice gate. Courier unable to complete delivery. Your mother’s address sits underneath yours, as if the parcel has been trying to find its way down through the years.',
      'You loosen the green string. There is a letter and a small glass bell, quiet in your hand. “Mara,” the letter begins, “I have to go back. There are people in the lower houses. I meant to tell you how happy I was this morning, watching you mend Inez’s coat. I thought there would be another morning.” The rest is blurred. On the opposite page, two instructions remain legible: Personal delivery, waiting carriage. Or unresolved correspondence, sorting room. The bell warms against your palm. Neither instruction says what the delivery will cost.'
    ],
    choices: [
      { label: 'Meet the person waiting in the carriage', to: 'carriage' },
      { label: 'Take the parcel to the sorting room', to: 'sorting' }
    ]
  },
  bridge: {
    title: 'The courier who stayed',
    kind: 'scene',
    paragraphs: [
      'The courier is a boy in an oversized yellow coat. He cannot be more than sixteen, although the parcel’s string has cut a pale groove across his hands. “I dropped it,” he says before you can ask. “The bridge went. Your father pulled me out. By the time I found the parcel again, the address was under water.”',
      'He opens the wrapping for you. A glass bell cradles a folded letter. Your father went back to raise the sluice gate; his last words were for Mara, who thought he had simply walked away. The boy offers his coat, as though that might settle a debt. You tell him being alive is enough. For the first time, he lets go of the string. Beyond the bridge, a carriage waits with one bright window. Beneath you, the sorting room hums with thousands of small, unheard voices.'
    ],
    choices: [
      { label: 'Carry the letter to the waiting carriage', to: 'carriage' },
      { label: 'Ask where the other lost words go', to: 'sorting' }
    ]
  },
  carriage: {
    title: 'The hour that never arrived',
    kind: 'scene',
    paragraphs: [
      'The carriage smells of hot wool and oranges. At its far end, your mother sits beside the window, younger than you are now. Rain presses against the glass. She is watching for someone who should have come home an hour ago. You almost call her name, but the glass bell begins to ring without making a sound.',
      'A conductor places two tickets on the seat. “Give her the bell, and she will hear him. Your childhood will remember a different silence. You will leave the words here, with her.” The second ticket is damp at the edges. “Take it home instead, and nothing behind you changes. The letter and his voice remain yours to share.” Your brother still will not speak your father’s name. Your mother has been dead for six years. Her young hand rests beside an empty place, waiting. Both tickets are punched for morning.'
    ],
    choices: [
      { label: 'Deliver the hour to Mara', to: 'return' },
      { label: 'Carry the letter into your own morning', to: 'carry' }
    ]
  },
  sorting: {
    title: 'A place for unfinished things',
    kind: 'scene',
    paragraphs: [
      'The sorting room has no walls you can see. Shelves recede into rain, each bearing a parcel and a little lamp. A birthday wish. An apology. A recipe nobody wrote down before the person who knew it died. Your glass bell answers them with a single, trembling note.',
      'The sorter lays a delivery slip beside it. “Mara is still waiting in the carriage. Send the bell, and that hour will reach her. You will keep the new memory, but the letter stays with her.” Then she unpins her badge. Underneath is the name of a woman you do not recognize, written over another. “Or take my place. These words need someone who will listen until their people arrive. The station asks for one memory of your own.” You think of your father teaching you a knot, his hands steady over yours. The sorter waits without reaching for the parcel.'
    ],
    choices: [
      { label: 'Send Mara the hour she was owed', to: 'return' },
      { label: 'Stay to give every parcel a witness', to: 'witness' }
    ]
  },
  return: {
    title: 'The light in the kitchen',
    kind: 'ending',
    paragraphs: [
      'Mara receives the bell. The hour opens around her, and your father’s voice fills the place where the kitchen lamp once went dark. She cries, but she stops watching the door. When you step into the street, the station is a boarded shop again.',
      'You remember something new: your mother saying he went back because someone needed him. The grief is still there. It has a different shape. The parcel is gone, and you cannot recite the letter. You can remember the warmth of the morning he described. At home, you call your brother. “There’s something about Dad,” you say. This time, the words arrive.'
    ], choices: []
  },
  carry: {
    title: 'A voice for the living',
    kind: 'ending',
    paragraphs: [
      'You take the damp ticket and hold the parcel close. Mara remains beside the carriage window; the sorrow of leaving her is sharp enough to keep. Outside, the rain stops. Platform Seven folds into the dark, but the green string stays real beneath your fingers.',
      'In the morning, your brother comes over. You set the glass bell between the coffee cups and read the letter aloud. Then the bell gives you your father’s voice, hesitant and ordinary and full of love. Neither of you can repair your mother’s lonely hours. You can stop repeating the wrong story. Your brother reaches for the letter. You let him have the first turn.'
    ], choices: []
  },
  witness: {
    title: 'Keeper of the rain',
    kind: 'ending',
    paragraphs: [
      'You give the station the memory of your father teaching you the knot. You know he taught you; you can no longer feel his hands. The loss leaves a small, clean space. Into it comes the sound of every bell on the shelves.',
      'The sorter fastens her badge to your coat. You set your parcel beside the others, with a lamp of its own. When the next rain begins, a frightened woman appears at Platform Seven carrying an envelope addressed to someone she has outlived. You pull out a chair. “We have time,” you tell her. Outside, the city hurries past a boarded shop. Inside, you begin to listen.'
    ], choices: []
  }
});

export const STORAGE_KEY = 'elsewhere.reading.v1';
export const DEFAULT_TITLE = 'The parcel I carried';
export function createState() { return { title: DEFAULT_TITLE, note: '', path: ['arrival'], decisions: [], prepared: null }; }
export function currentNode(state) { return STORY[state.path.at(-1)]; }
export function validation(state) {
  if (!state.title.trim()) return 'Give your journey a title before preparing it.';
  if (state.title.length > 100) return 'Keep your journey title to 100 characters.';
  if (state.note.length > 800) return 'Keep your note to 800 characters.';
  return '';
}
export function signature(state) { return JSON.stringify([state.title, state.note, state.path, state.decisions]); }
export function preparedStatus(state) {
  if (validation(state)) return 'invalid';
  if (!state.prepared) return 'empty';
  return state.prepared.signature === signature(state) ? 'ready' : 'stale';
}
export function edit(state, changes) {
  const next = { ...state };
  if ('title' in changes) next.title = String(changes.title);
  if ('note' in changes) next.note = String(changes.note);
  return next;
}
export function choose(state, index) {
  const choice = currentNode(state).choices[index];
  if (!Number.isInteger(index) || !choice) throw new Error('Choose one of the current scene’s available actions.');
  return { ...state, path: [...state.path, choice.to], decisions: [...state.decisions, index] };
}
export function revisit(state, index) {
  if (!Number.isInteger(index) || index < 0 || index >= state.path.length) throw new Error('That scene is not in this reading.');
  return { ...state, path: state.path.slice(0, index + 1), decisions: state.decisions.slice(0, index) };
}
export function restart(state) { return { ...state, path: ['arrival'], decisions: [] }; }
export function recordsFor(state) {
  return state.path.map((id, i) => ({ id, title: STORY[id].title, kind: STORY[id].kind, paragraphs: [...STORY[id].paragraphs], chosenLabel: i < state.decisions.length ? STORY[id].choices[state.decisions[i]].label : null }));
}
export function readingText(snapshot) {
  const lines = ['ELSEWHERE', 'A parcel for the rain', '', `JOURNEY: ${snapshot.title}`, `STATUS: ${snapshot.status}`];
  if (snapshot.note) lines.push(`NOTE: ${snapshot.note}`);
  lines.push('');
  snapshot.records.forEach((record, i) => {
    lines.push(`${String(i + 1).padStart(2, '0')}. ${record.title}`, '', ...record.paragraphs.flatMap((p, j) => j ? ['', p] : [p]), '');
    if (record.kind === 'ending') lines.push('END OF READING', '');
    else lines.push(`CHOICE: ${record.chosenLabel || 'Not yet chosen — this reading is unfinished.'}`, '');
  });
  return lines.join('\n');
}
export function prepare(state) {
  const error = validation(state);
  if (error) return { ok: false, state, message: error };
  const node = currentNode(state);
  const snapshot = { title: state.title.trim(), note: state.note.trim(), records: recordsFor(state), status: `${node.kind === 'ending' ? 'Complete' : 'Unfinished'} — ${node.title}`, signature: signature(state) };
  snapshot.text = readingText(snapshot);
  return { ok: true, state: { ...state, prepared: snapshot }, message: node.kind === 'ending' ? 'Your complete reading is prepared.' : 'Your unfinished reading is prepared and labeled as unfinished.' };
}
export function canExport(state) { return preparedStatus(state) === 'ready'; }
function validateStored(data) {
  if (!data || data.version !== 1 || !data.state || !data.prepared) throw new Error('This kept reading could not be understood.');
  const raw = data.state;
  if (typeof raw.title !== 'string' || typeof raw.note !== 'string' || !Array.isArray(raw.path) || !Array.isArray(raw.decisions) || raw.path[0] !== 'arrival' || raw.path.length > 5 || raw.decisions.length !== raw.path.length - 1) throw new Error('This kept reading has an incomplete route.');
  let state = edit(createState(), { title: raw.title, note: raw.note });
  raw.decisions.forEach((index, i) => {
    state = choose(state, index);
    if (state.path[i + 1] !== raw.path[i + 1]) throw new Error('This kept reading has an inconsistent route.');
  });
  const result = prepare(state);
  if (!result.ok || data.prepared.text !== result.state.prepared.text || data.prepared.signature !== result.state.prepared.signature) throw new Error('This kept reading does not match its prepared text.');
  return result.state;
}
export function saveKept(state, storage) {
  if (!canExport(state)) return { ok: false, message: validation(state) || 'Prepare the current reading before keeping it.' };
  try {
    const payload = JSON.stringify({ version: 1, state: { title: state.title, note: state.note, path: state.path, decisions: state.decisions }, prepared: { text: state.prepared.text, signature: state.prepared.signature } });
    storage.setItem(STORAGE_KEY, payload);
    if (storage.getItem(STORAGE_KEY) !== payload) throw new Error('Storage did not confirm the kept reading.');
    return { ok: true, message: 'This prepared reading is kept in this browser.' };
  } catch { return { ok: false, message: 'This browser could not keep the reading. You can still download it.' }; }
}
export function loadKept(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { ok: false, exists: false, message: 'There is no kept reading in this browser.' };
    return { ok: true, exists: true, state: validateStored(JSON.parse(raw)), message: 'The kept reading has been recovered.' };
  } catch { return { ok: false, exists: true, message: 'The kept reading is unavailable or damaged. Start a new reading, or forget it.' }; }
}
export function forgetKept(storage) {
  try {
    storage.removeItem(STORAGE_KEY);
    if (storage.getItem(STORAGE_KEY) !== null) throw new Error('Storage did not confirm removal.');
    return { ok: true, message: 'The kept reading has been forgotten. Your open reading is still here.' };
  } catch { return { ok: false, message: 'This browser could not forget the kept reading. Check its storage permissions.' }; }
}
