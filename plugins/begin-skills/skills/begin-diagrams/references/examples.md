# Original illustrative diagrams

These examples model fictional systems. They provide editable Mermaid source with accessible titles and descriptions. They do not describe Begin, a generated website, or the included enquiry implementation. Adapt the relationships from the actual task's sources.

## Component requests

[Component view](../assets/examples/component-requests.mmd) answers which parts handle visitor and owner requests. Arrows mean requests and database operations; response payloads and the login sequence are omitted. The model assumes owner authentication and access scoping in the inbox handler. Verify those assumptions before applying it to an existing system.

## Message submission

[Submission sequence](../assets/examples/message-submission.mmd) answers what a visitor observes when fields are invalid, a save succeeds, or storage fails. Solid arrows show requests or operations; dashed arrows show replies in this example. It assumes a request waits for a database outcome before the page confirms a save. It makes no claim about email delivery.

## Document lifecycle

[Document states](../assets/examples/document-states.mmd) follows one fictional document revision from draft to publication. Publication is terminal for that revision in this deliberately small model. A next revision, withdrawal, and access permissions are outside its scope. Use the actual project's states when describing a real workflow.

## Record relationships

[Record model](../assets/examples/record-relationships.mmd) answers who maintains a website and where an enquiry belongs. It assumes each website has exactly one owner and each enquiry has exactly one website. Owners can have no websites, and websites can have no enquiries. Each entity has its own ID, so the illustrated relationships do not contribute to a child's primary-key identity. Owner access rules and database enforcement require separate evidence.
