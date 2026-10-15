# Vercel publishing recipe

Check the installed CLI, linked project, account, and authorized target. This recipe does not establish a deployed site.

```sh
vercel --version
vercel deploy --help
vercel whoami
```

Inspect the artifact, then use the exact website directory:

```sh
vercel deploy --cwd "/absolute/path/to/website"
```

A new project's first deployment is production even without `--prod`. Confirm the selected project's environment before running this command. Later production deployments use `--prod`; choose supported target/configuration for the requested environment.

Use `--public` only when source exposure at `/_src` is intended. Capture stdout as the deployment URL after a successful exit. With `--no-wait`, follow the returned deployment to completion. Keep its ID while pending instead of resubmitting unchanged source.

Record project, URL, revision, and environment, then check the site and central action. Account, billing, access protection, and domains remain provider configuration. Keep local enquiry data off static deployments.

Reference: [Vercel deploy](https://vercel.com/docs/cli/deploy).
