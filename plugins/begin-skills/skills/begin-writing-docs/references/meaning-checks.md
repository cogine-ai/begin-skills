# Meaning checks for technical edits

Use these original software examples to compare a revision with its source. The stronger sentence is useful only when the actual system supports it.

| Source meaning | Clear revision | A revision that changes the claim |
| --- | --- | --- |
| Storage succeeds before an email attempt starts | “After the server saves the enquiry, it requests email delivery.” | “The server saves and delivers the enquiry.” |
| A provider returns an acceptance response | “The provider accepted the delivery request.” | “The recipient received the email.” |
| A retry is allowed only after failure | “If delivery fails, the owner can request a retry.” | “The owner can retry delivery at any time.” |
| The server rejects an access request without a valid session | “Without a valid session, the server rejects the request.” | “The server usually checks the session.” |
| A CLI filters records that the caller can already read | “`--site` selects records from the input file for the report.” | “`--site` grants access to the site's records.” |
| A source cannot establish a delivery outcome | “The record reports an unknown delivery state.” | “Delivery failed.” |
| A record can remain for up to 30 days | “The service may retain the record for up to 30 days.” | “The service retains the record for 30 days.” |
| A command prints to stdout | “The command prints the report. Add shell redirection to save it to a file.” | “The command saves a report.” |
| Each identifier must occur once in the entire file | “Each enquiry ID must be unique across the file.” | “Each site must have unique enquiry IDs.” |

## Check consequential changes

Read the original and the revision with these questions in mind:

- Who performs the action? Who owns or can access the data?
- What happens first, and what happens only if another action succeeds?
- Does the statement describe a request, an accepted request, an observed result, or a proposed behavior?
- Did a possibility become a guarantee, or a requirement become a suggestion?
- Did an unknown value become false, failed, empty, or zero?
- Did a limit, unit, exception, negative, or recovery action disappear?

Do not resolve an ambiguous source by silently choosing the most convenient meaning. Inspect the relevant interface or ask for the one missing fact that changes the reader's action.

## Example of a useful edit

Original: “Successful notification orchestration enables seamless customer contact after enquiry persistence.”

Revision supported by a save-then-send implementation: “The server saves the enquiry before it asks the email provider to send a notification. If the email request fails, the saved enquiry remains available to its owner.”

The revision names the actors, preserves ordering, and explains the failure boundary. It still does not claim that a recipient read or received an email.
