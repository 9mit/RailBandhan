# Apply the rebuild

The GitHub integration rejected uploading Git objects with HTTP 403. The source changes are committed locally on `codex/railbandhan-rebuild`; the remote repository is unchanged. This handoff includes complete source and `RailBandhan-rebuild.patch`, including binary assets.

## Apply to a clean clone

Run these commands in a fresh clone so existing local work stays separate. Replace the patch path with its location after extracting the download.

```bash
git clone https://github.com/9mit/RailBandhan.git RailBandhan-review
cd RailBandhan-review
git switch -c codex/railbandhan-rebuild 5d72c4a7be63910cc5f9af5f2ad49e97c708ed13
git apply --check /absolute/path/RailBandhan-rebuild.patch
git apply --index /absolute/path/RailBandhan-rebuild.patch
git commit -m "Rebuild RailBandhan design, security, persistence and operations"
```

The patch is based on the exact commit above. If the remote has moved, merge/rebase the candidate through normal review after applying it. Do not force-push over another person's branch or replace an existing working tree with the archive.

Use Node.js 24, install Poppler/Tesseract for ticket extraction, then validate:

```bash
npm --prefix apps/web ci
npm run lint
npm run typecheck
npm run test
npm run build
```

For local use, copy `.env.example` to `apps/web/.env.local` and run `npm run dev`. Read [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) before running the production server. Production intentionally refuses incomplete secrets/database settings.

With a GitHub account or integration that has repository content write permission, push the new branch and open a draft pull request targeting `main`. Observe CI and address the gates in [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) before a release. The archive does not include dependencies, builds, runtime data, credentials or `.git` history.

Alternatively, use the complete `RailBandhan/` source folder in the handoff as a standalone review copy. The patch route preserves the original repository history and file deletions most clearly.
