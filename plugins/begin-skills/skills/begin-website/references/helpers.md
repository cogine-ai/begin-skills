# Starter helpers

Resolve the installed `begin-website` Skill directory from the file that the host loaded. Assign its absolute path to `BEGIN_WEBSITE_SKILL`. Substitute actual project paths in these examples; do not assume the process started inside the pack.

```sh
node "${BEGIN_WEBSITE_SKILL}/scripts/create-site.mjs" \
  --template service \
  --output "/absolute/path/to/new-site" \
  --contact "mailto:owner@example.com"
```

The template choices are `service`, `portfolio`, `product`, and `editorial`. The output must be a new directory. An HTTPS contact destination can replace the mailto link. Use an address supplied by the website owner; `owner@example.com` above demonstrates the argument format. Reading is the editorial starter's main action; its footer contact is optional.

```sh
node "${BEGIN_WEBSITE_SKILL}/scripts/preview.mjs" \
  --dir "/absolute/path/to/new-site" \
  --port 0 --background
```

Read the helper's output for the actual URL and port. Background mode is for a local host that permits a detached process; it keeps the preview available after the launching command exits. It stores its ownership receipt inside the website's private `.begin-preview/` directory. Port `0` asks the helper to use an available port. If the host cannot display a local server, use its documented forwarding or preview capability; do not pretend the URL is public.

Check or stop that website's owned preview using the same helper:

```sh
node "${BEGIN_WEBSITE_SKILL}/scripts/preview.mjs" --dir "/absolute/path/to/new-site" --status
node "${BEGIN_WEBSITE_SKILL}/scripts/preview.mjs" --dir "/absolute/path/to/new-site" --stop
```

Record the actual URL and these commands in `BEGIN.md`. Reuse a running preview when editing the same website. Stop it when finished. Without `--background`, the helper runs in the foreground until Ctrl+C; keep that terminal session alive. A host that kills detached processes still needs its supported persistent terminal or forwarding path. Check actual reachability before handing over the URL.

The copied starter is independent website source. Continue editing that directory. Changes to the installed pack do not automatically change existing websites. Read the starter's included instructions for its files and customization points.

If a helper fails, inspect the error before retrying. An existing destination, unsupported contact URL, missing Node executable, and blocked preview require different fixes. Do not loosen overwrite protections or modify unrelated host settings to make a retry pass.
