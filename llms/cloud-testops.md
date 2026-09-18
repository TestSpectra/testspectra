# Cloud TestOps & Dashboard

> Collect CI runs in one dashboard — failure video replays, quality tracking, and Gitea/GitHub sign-in.

**Platforms:** all · **Badge:** Cloud

## AI Summary

Cloud TestOps ingests CI test runs via POST /api/v1/runs/ingest; dashboard offers video replays, quality matrix, and Gitea/GitHub sign-in.

---
## CI/CD Stream Ingestion

TestSpectra Cloud TestOps ingests execution reports, console logs, and video replays from GitHub Actions, GitLab CI, or Gitea:

```bash
# Push test execution result from CI runner
curl -X POST https://testops.testspectra.dev/api/v1/runs/ingest \
  -H "Authorization: Bearer $TESTSPECTRA_TOKEN" \
  -H "Content-Type: application/json" \
  -d @.testspectra/reports/report.json
```

---

## Video & Trace Replay

Inside the Cloud dashboard:
- **Synchronized Replay**: Step through video recordings synchronized with network request timelines.
- **Quality Matrix**: Identify flaky tests, failure trends, and duration regressions across branches.
- **Search & Filter**: Filter execution history by project, branch, author, and commit hash.

---

## Sign In With Gitea & GitHub

Sign in with your existing Gitea or GitHub account — no separate TestSpectra password to manage, and permissions follow your repository access.
