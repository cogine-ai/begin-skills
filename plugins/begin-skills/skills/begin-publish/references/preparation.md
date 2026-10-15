# Publishing preparation and recovery

## Know the destination

Identify the exact website directory, site owner, provider account/project, environment, intended audience, intended URL, and central action. Use existing authorization and project IDs. For an update, find the current website instead of registering another one. If a material detail is missing, prepare the local artifact while resolving that detail.

Inspect the site's run/build instructions and existing hosting configuration. A static starter can use its static files. A framework may require a build output or supported server runtime. An API with a persistent local data directory requires a compatible hosting and storage plan before public use.

## Inspect the output

Check configuration values and contact destinations, replace illustrative owner details where required, and inspect included assets and notices. Exclude private config, databases, logs, credentials, and unrelated files. Verify important routes and media paths with the hosting base path in mind.

Keep a local preview available for review. Run relevant build and functional checks where applicable. Identify remaining setup honestly, such as a real booking destination or domain configuration. Reuse successful setup/build output while its inputs are unchanged; rebuild when source, dependencies, or relevant configuration changes.

## Follow the deployment through completion

Retain the source revision or artifact version, provider project, deployment ID, target environment, and returned status. An accepted job or preview URL can precede a ready deployment. Use the provider's supported status or preview path to follow the same operation. Do not redeploy unchanged source simply because its result is still pending.

## Inspect the deployed result

A deployment command's success establishes only what it reports. Inspect the returned URL in the intended environment using supported preview/browser tools. Verify access settings, phone/desktop layout when rendering tools are available, navigation, asset loading, and the central action. A protected preview establishes rendering for that audience. Anonymous public access, email delivery, and booking completion need their own observations if claimed. Do not remove intended access protection merely to make a check pass.

Record the deployed revision and URL without credentials. Keep production and preview environment variables distinct. Domain changes affect an external destination; inspect the provider's actual domain/status result instead of assuming a DNS command completed propagation.

## Update and recover

Preserve the last useful deployment, current user changes, and existing hosting settings. Apply a focused update, inspect it, then use the authorized publishing path. Diagnose the failed stage before repeating the operation:

- A build failure needs its relevant compiler/dependency/configuration evidence.
- A ready deployment with failed routes needs runtime logs and the expected server or base-path configuration.
- A permission or audience failure needs the existing project/access settings.
- Missing records or uploaded files need the actual storage/connection path, including ephemeral local storage.

Keep IDs and usable output from successful stages. Retry only after addressing the failure or confirming that the provider supports a safe retry.

For recovery, use the provider's documented rollback or a known prior revision after confirming the affected environment and its configuration. A code rollback does not reverse database migrations, sent messages, or payment effects. Plan those recoveries separately. Return the confirmed URL and version, checks actually completed, any remaining blocker, and the next step without credentials.
