# Branch Protection Rules

This document outlines the branch protection rules that should be configured on GitHub.

## Protected Branches

### `main` branch

**Settings to enable on GitHub:**

1. **Require pull request reviews before merging**
   - Required approving reviews: 1
   - Dismiss stale pull request approvals when new commits are pushed: ✓
   - Require review from Code Owners: ✓

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging: ✓
   - Status checks required:
     - Lint Code
     - Build Application
     - Security Audit

3. **Require conversation resolution before merging**: ✓

4. **Require signed commits**: ✓ (recommended)

5. **Require linear history**: ✓ (recommended)

6. **Include administrators**: ✓ (even admins need PR reviews)

7. **Restrict who can push to matching branches**
   - Only allow: Repository administrators

8. **Allow force pushes**: ✗ (disabled)

9. **Allow deletions**: ✗ (disabled)

### `develop` branch

Same settings as `main` but slightly relaxed:

1. **Require pull request reviews before merging**
   - Required approving reviews: 1
   - Require review from Code Owners: ✓

2. **Require status checks to pass before merging**: ✓

3. **Require conversation resolution before merging**: ✓

## Repository Settings

### General Settings

1. **Features**
   - Wikis: ✗ (disabled)
   - Issues: ✓ (enabled)
   - Sponsorships: ✗ (disabled)
   - Projects: ✓ (enabled)
   - Discussions: ✗ (optional)

2. **Pull Requests**
   - Allow merge commits: ✓
   - Allow squash merging: ✓
   - Allow rebase merging: ✓
   - Always suggest updating pull request branches: ✓
   - Automatically delete head branches: ✓

3. **Merge button**
   - Default to PR title for squash merge: ✓

### Code Security and Analysis

1. **Dependabot alerts**: ✓ (enabled)
2. **Dependabot security updates**: ✓ (enabled)
3. **Dependabot version updates**: ✓ (enabled via .github/dependabot.yml)
4. **Secret scanning**: ✓ (enabled - if available)
5. **Code scanning**: ✓ (enabled - if available)

### Collaborators and Teams

Define access levels:
- **Admin**: You (owner)
- **Write**: Trusted contributors (can push to feature branches)
- **Read**: Everyone else (can view and fork)

## How to Configure on GitHub

1. Go to repository **Settings**
2. Navigate to **Branches** in the left sidebar
3. Click **Add branch protection rule**
4. Enter branch name pattern: `main`
5. Configure settings as listed above
6. Repeat for `develop` branch

## Workflow

### For Contributors

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature

# 2. Make changes and commit
git add .
git commit -m "feat: your feature"

# 3. Push to remote
git push origin feature/your-feature

# 4. Open Pull Request on GitHub
# - Target: develop
# - Request review from code owner
# - Wait for CI/CD checks to pass
# - Address review comments
# - Once approved, merge

# 5. Delete branch after merge (automatic if configured)
```

### For Repository Owner

```bash
# Review and merge PRs via GitHub interface
# Never push directly to main or develop
# Use PR process even for your own changes

# To release:
# 1. Merge develop into main via PR
# 2. Tag release
git checkout main
git pull origin main
git tag -a v0.1.0 -m "Release version 0.1.0"
git push origin v0.1.0
```

## File Protection via CODEOWNERS

The `CODEOWNERS` file defines who must review changes to specific files:

- All backend files: Repository owner
- Security-related files: Repository owner
- Configuration files: Repository owner
- Documentation: Anyone can contribute

## Emergency Procedures

If you need to bypass protections (emergency only):

1. Go to Settings > Branches
2. Temporarily disable protection
3. Make emergency fix
4. Re-enable protection immediately
5. Document reason in commit message
6. Create follow-up PR to review changes

## Enforcement

- All changes to protected branches MUST go through Pull Requests
- PRs MUST pass all CI/CD checks
- PRs MUST be approved by code owner
- Direct pushes to protected branches are blocked
- Force pushes are blocked
- Branch deletions are blocked

This ensures code quality and prevents unauthorized changes.
