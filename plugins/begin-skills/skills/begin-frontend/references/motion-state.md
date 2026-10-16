# Keep motion faithful to the operation

Use this when implementing direct manipulation, a changing diagram or a continuous creative preview. Keep the existing framework and dependencies. A small browser implementation can be enough.

## Separate facts, painted state and scheduling

The current valid model owns identity, values and exports. A finite transition may also have a last painted state and a target. On a new discrete choice, cancel the old work and interpolate from the painted state toward the latest target. Never let an earlier completion restore obsolete values. Direct range or pointer input should paint its current value without an extra eased chase.

For a creative preview whose agreed behavior is to hold phase while absent, keep phase separate from playback intent. Define eligibility using the actual visible preview, document visibility and the agreed motion-preference behavior. Cancel a pending animation frame on pause, suspension and disposal. In that held-phase preview, reset the time origin on resume so hidden elapsed time does not jump the work forward. A reduced-motion preference can start paused while leaving a deliberate Play action available for a creative tool. State that choice accurately and handle preference changes during the session.

When layout changes which preview is visible, observe that rendered surface. A hidden desktop image must not keep a phone animation alive; a visible compact preview must not be classified as offscreen because an older full preview has scrolled away. Check actual bounding positions and observer behavior after the change.

A sticky preview changes the space available to focused controls. Native focus scrolling may leave a preceding input behind that preview on Shift+Tab. Keep the control's visible label and focus treatment clear of the rendered obstruction in both directions, including at short heights. A one-pixel radio input does not describe its full visible option.

For a finite CSS diagram transition, verify its start is visible where it helps the reader. Essential prose and still explanations remain accessible without the observer. Avoid scroll interception unless the actual task requires it.

## Keep the operation and its context together

When a person starts dragging a different object, update its selected identity and related editor before painting that object's changing coordinates. Preserve the pointer-capturing node during the gesture. Inspect the middle of the operation; a consistent endpoint can hide a mismatched name or note during movement.

Preserve the ordinary keyboard route through a selection change. Replacing the focused object can leave focus on the document even when arrow nudging works after explicit refocus. Test Enter or Space to select, then the next intended key. Avoid replaying a selection entrance on every nudge or render; keep repeated direct edits immediate.

For a real elapsed-time task, keep the domain clock separate from display scheduling. A running countdown may need to account for time away, including several completed segments, while a deliberately paused countdown stays held. Suspending hidden display work must not silently pause that domain clock. Define recovery and device-clock limits for the actual task; the held-phase behavior of a creative preview is conditional.

## Keep every representation consistent

Use the same valid model for live drawing, readable facts and export. Capture the held phase before creating a still file. Make a portable playback file self-contained when that is its promise; verify it opens at the expected phase and has usable controls without network resources.

Name the note's subject explicitly if an active item, selected subject and saved checkpoint can differ. A visit to a second item followed by a note and download is a useful contract check. Automatic draft recovery should not silently change an explicitly kept bookmark.

When an invalid field restores the last valid value, restore its validity and related feedback together. A stale red instruction is still an error in the interface even when the underlying value is correct.

## Verify the moving implementation

Exercise the implemented change and interruption paths. For a finite transition, check rapid retargeting and direct range or keyboard adjustment where those exist. For continuous playback, also check pause, live preference change and actual offscreen scroll. Inspect actual downloads when provided. Count continuous graphics' scheduled work while stopped; a still screenshot cannot show whether a loop continues running.

Frame-count instrumentation can itself request frames. Poll such checks with an ordinary timer and keep instrumentation outside delivered product code. A synthetic `document.hidden` override checks a lifecycle branch; label it separately from a native background-tab observation. Local browser checks do not establish low-end-phone performance or every host engine. Profile deeper only for an observed performance concern or a concrete requirement.
