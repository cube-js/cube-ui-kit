# Publishing CI/CD Documentation

This document describes how the npm publishing workflows operate and the manual steps required for setup.

## Current Behavior (User Perspective)

### On Pull Request

When you create or update a pull request:

1. **Canary Release** — A canary version is automatically published to npm
   - Version format: `0.0.0-canary-<short-sha>`
   - npm tag: `pr_<pr-number>` (e.g., `pr_123`)
   - A comment is posted to the PR with the npm link:
     > Deployed canary version [0.0.0-canary-abc1234](https://www.npmjs.com/package/@cube-dev/ui-kit/v/0.0.0-canary-abc1234)
   - Install via: `npm install @cube-dev/ui-kit@pr_<pr-number>`

2. **Tests & Lint** — Linting and unit tests run in parallel

3. **Storybook Review** — Storybook is deployed to Chromatic for visual review
   - A comment is posted with review and preview links

4. **Size Limit** — Bundle size is measured and reported in a PR comment

### On Push to `main` Branch

When changes are pushed to `main` (typically via merged PRs):

1. **Changesets Processing** — The workflow checks for pending changesets:
   
   **If there are pending changesets:**
   - A "Release Pull Request" is created/updated automatically
   - This PR contains version bumps and changelog updates
   - No npm publish happens yet
   
   **If there are no pending changesets (Release PR was just merged):**
   - The package is built and published to npm
   - Uses the version specified in `package.json` (updated by the Release PR)
   - Published with the `latest` tag

2. **Storybook Deployment** — If no publish happened, Storybook is deployed to Chromatic production
   - Auto-accepts visual changes since this is the main branch

### Release Workflow Summary

```
Developer creates PR → Canary published → PR merged to main
                                              ↓
                                    Has pending changesets?
                                    ├── Yes → Create/update Release PR
                                    └── No → Publish to npm
```

## Ignored Paths

Pull request workflows are skipped for changes only in:
- `.changeset/**`
- `.husky/**`

---

## Trusted Publishing Migration

### What Changed

Publishing now uses npm's [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) feature with OIDC authentication. All publishing logic is consolidated in a single `publish.yml` workflow that handles both canary releases (on PRs) and production releases (on push to main). This is required because npm only allows one trusted publisher configuration per package.

### Benefits

- **No more NPM_TOKEN secret** — Authentication uses OIDC tokens
- **Automatic provenance** — npm automatically generates provenance attestations
- **Enhanced security** — Short-lived tokens instead of long-lived secrets
- **Audit trail** — Cryptographic proof of build origin

---

## Manual Setup Steps

> ⚠️ **CRITICAL**: Complete Step 1 **BEFORE** any workflow runs. The workflow will fail with `ENEEDAUTH` error if the trusted publisher is not configured first!

### Step 1: Configure Trusted Publisher on npmjs.com

1. Log in to [npmjs.com](https://www.npmjs.com) with an account that has publish access
2. Go to: https://www.npmjs.com/package/@cube-dev/ui-kit/settings
3. Scroll to the **"Trusted Publisher"** section
4. Click the **"GitHub Actions"** button
5. Fill in the configuration **exactly** as shown:

   | Field | Value |
   |-------|-------|
   | Owner | `cube-js` |
   | Repository | `cube-ui-kit` |
   | Workflow filename | `publish.yml` |
   | Environment | _(leave empty)_ |

6. Click **Save**

> **Note**: The `publish.yml` workflow handles both canary releases (on PRs) and production releases (on push to main). npm only allows one trusted publisher configuration, so all publishing logic is consolidated in this single workflow file.

### Step 2: Verify the Setup with a Test PR

1. Create a test branch and PR with minimal changes
2. Watch the GitHub Actions for the canary release job
3. Verify the canary package appears on npm with the correct version
4. Check that provenance badge appears on the npm package page

### Step 3: Test Full Release Flow

1. Add a changeset to your test branch: `pnpm changeset`
2. Merge the test PR to `main`
3. Verify a "Release Pull Request" is created automatically
4. Merge the Release PR
5. Verify the package is published with:
   - Correct version
   - Provenance attestation (visible on npm package page)

### Step 4: (Recommended) Restrict Token Access

After verifying trusted publishing works for both canary and release:

1. Go to npm package settings → **Publishing access**
2. Select **"Require two-factor authentication and disallow tokens"**
3. Click **Update Package Settings**

> This prevents accidental token-based publishes and enhances security.

### Step 5: Clean Up NPM_TOKEN Secret

Once everything is working:

1. Go to GitHub repo: Settings → Secrets and variables → Actions
2. Delete the `NPM_TOKEN` secret
3. This is optional but recommended for security

> ⚠️ Keep the token until you're 100% confident the new setup works.

---

## Workflow Files

| File | Purpose |
|------|---------|
| `publish.yml` | Handles all npm publishing (canary on PRs, releases on main) and Chromatic deployment |
| `pull-request.yml` | PR workflow for tests and Chromatic staging |
| `size-limit.yml` | Bundle size measurement |
| `codeql-analysis.yml` | Security analysis |

---

## Pre-Merge Checklist

Before merging the trusted publishing PR, verify:

- [ ] You have maintainer access to the package on npmjs.com (to configure trusted publisher)
- [ ] Trusted publisher configured for `publish.yml`
- [ ] Configuration matches exactly: `cube-js` / `cube-ui-kit` / `publish.yml`

---

## Troubleshooting

### `ENEEDAUTH` / "need auth" / "You need to authorize this machine" error

This is the most common error when first setting up trusted publishing:

1. **Trusted publisher not configured yet** — Go to npmjs.com and configure the trusted publisher (Step 1 above)
2. **Configuration mismatch** — Double-check that Owner, Repository, and Workflow filename match EXACTLY: `cube-js` / `cube-ui-kit` / `publish.yml`
3. **Environment mismatch** — If you specified an environment on npmjs.com, the workflow must use the same environment name (we leave it empty by default)

### "Unable to authenticate" error

- Verify the workflow filename matches **exactly** (`publish.yml`, not `Publish.yml`)
- Ensure all fields are case-sensitive and match exactly
- Check that you're using GitHub-hosted runners (not self-hosted)
- Verify the repository and organization names are correct (`cube-js`, `cube-ui-kit`)

### Provenance not generated

- Provenance is only generated for **public** repositories
- Ensure the package is public
- Private repositories cannot generate provenance even for public packages

### Canary releases failing

- Check that the workflow has `id-token: write` permission
- Verify the trusted publisher is configured for `publish.yml`
- Ensure npm version is 11.5.1+ (the workflow updates this automatically)

### Changesets action not publishing

- Changesets action uses npm internally, so trusted publishing should work
- If issues persist, check GitHub Actions logs for OIDC token errors
- Verify `GITHUB_TOKEN` is passed (needed for creating Release PRs)

### Workflow file validation failed

npm does not validate the trusted publisher configuration when you save it. Double-check:
- Repository name matches exactly
- Organization/username matches exactly  
- Workflow filename includes `.yml` extension
- No trailing spaces in any field
