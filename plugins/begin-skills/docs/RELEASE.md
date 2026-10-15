# Prepare a Begin release

This is the maintainer checklist for the standard installation distribution and English website. The delivery formats share one complete sanitized plugin payload.

## Build and freeze

1. Set one new version in all three plugin manifests. Keep each previously distributed version fixed.
2. Update installation sources and guides to the new tag. Record completed host checks in `STATUS.md` and retain their frozen input identity.
3. Run the bundle, distribution, installer and helper checks. Export both ZIPs and the clean distribution into a fresh preparation directory. Verify the plugin payload is identical in all formats, apart from format-specific receipts and root catalogs.
4. Build the static release site with `release/build.py --packages <verified package directory> --output <fresh output>`. Keep the full ZIPs outside the website. Check exact metadata, copy actions, private/public availability and actual phone/desktop views.
5. Freeze the final outputs and external BUILD receipts. Preserve first-use and visual review evidence outside all delivered resources.

The clean tree's root contains both native marketplace catalogs, README and INSTALL. The complete plugin is in `plugins/begin-skills/`; standard Skills CLI installation targets `plugins/begin-skills/skills/`. Do not point either public installer at the development monorepo root.

## Publish the selected source

The owner approved the dedicated public `cogine-ai/begin-skills` repository, MIT for Begin-authored material and Cloudflare marketing-site deployment on 15 October 2026. Publish a clean distribution with new Git history; retain the private development monorepo. Keep third-party notices and immutable earlier artifacts.

The Alpha.5 source is `cogine-ai/begin-skills` at `begin-skills-v0.1.0-alpha.5`. Publish that tag only from the exact clean distribution snapshot, with the plugin at its documented path. Upload the exact named Skills and plugin ZIPs as Release assets, or set equivalent verified mirror URLs. Publish the SHA-256 identities with those assets.

The named remote source must exist before installation acceptance can pass. Check the pinned tag anonymously from a fresh workspace. Keep every copy request, guide, catalog/source reference and metadata aligned before freezing the release.

## Verify remotely and deploy

From a fresh workspace, use the published source for native Codex, native Claude Code and the scoped Skills CLI. Inspect actual discovery and complete resources. Use an ordinary request for setup and making; check preview, a visible edit and continuation in a new conversation. Keep the independent host evidence explicit.

Deploy only the small static site to Cloudflare Workers Static Assets. GitHub Releases or R2 serves backup downloads. Verify the actual public page, relative assets, copy requests, downloads and feedback destination; prepared local checks alone do not establish remote success.

Set `sourcePublished` after confirming the named source. Set `publicGitHubInstall` only after the public installation path is checked. Set `packageDownloadsAvailable` after the exact asset URLs work. Set `repoFeedbackAvailable` after checking the Issues destination and `publicRepoFeedback` after checking its public accessibility. Regenerate the site under a fresh revision after changing these observations.

## Updates

A tag is immutable. Choose a new official source for the next release, then update through the manager that installed the pack. Verify website files, BEGIN.md, existing instructions and unrelated Skills stay intact. Retain previous output identities and known host limits.
