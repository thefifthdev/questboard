#!/usr/bin/env bash
# Seed QuestBoard's contributor backlog as labeled GitHub issues.
#
# Requires the GitHub CLI authenticated against the repo (`gh auth status`).
# Idempotent-ish: re-running creates duplicates, so run once on a fresh repo.
#
#   ./scripts/seed-issues.sh
set -euo pipefail

REPO="${REPO:-thefifthdev/questboard}"

ensure_label() {
  gh label create "$1" --repo "$REPO" --color "$2" --description "$3" 2>/dev/null || true
}

ensure_label "Stellar Wave"     "7c5cff" "Eligible for Stellar Wave / Drips contributor rewards"
ensure_label "good first issue" "2dd4bf" "Good for newcomers"
ensure_label "area: contract"   "5319e7" "Soroban contract"
ensure_label "area: web"        "1d76db" "Next.js web app"
ensure_label "area: server"     "0e8a16" "Express/Prisma indexer"
ensure_label "area: docs"       "d4c5f9" "Documentation"

issue() {
  local title="$1" labels="$2" body="$3"
  echo "Creating: $title"
  gh issue create --repo "$REPO" --title "$title" --label "$labels" --body "$body"
}

issue "feat(contract): DAO multi-approver (M-of-N) reward release" \
  "Stellar Wave,area: contract" \
  $'## Problem\nDAOs need decentralized oversight of payouts.\n\n## Proposed solution\nAdd an optional set of approvers and a threshold to a quest; `approve` succeeds only after M-of-N approvers sign.\n\n## Acceptance criteria\n- [ ] New optional approver set + threshold on post\n- [ ] approve aggregates signatures until threshold\n- [ ] Unit tests for the M-of-N paths'

issue "feat(contract): on-chain reputation — completed quests per worker" \
  "Stellar Wave,area: contract" \
  $'## Problem\nWorkers have no portable, verifiable track record.\n\n## Proposed solution\nMaintain a per-worker counter (and optionally total earned) updated on approve.\n\n## Acceptance criteria\n- [ ] `reputation(worker)` view\n- [ ] Incremented on approve\n- [ ] Tests'

issue "feat(contract): dispute & arbitration flow for rejected submissions" \
  "Stellar Wave,area: contract" \
  $'## Problem\nApproval is owner-only; workers have no recourse.\n\n## Proposed solution\nAdd a Disputed state and a neutral arbiter resolution path.\n\n## Acceptance criteria\n- [ ] open_dispute / resolve_dispute\n- [ ] Tests for each resolution outcome'

issue "feat(contract): allow-list reward tokens on-chain" \
  "area: contract" \
  $'## Problem\nAny token can currently be used as a reward.\n\n## Acceptance criteria\n- [ ] Admin-managed token allow-list\n- [ ] post_quest rejects non-listed tokens\n- [ ] Tests'

issue "feat(web): \"My quests\" dashboard (posted & claimed)" \
  "Stellar Wave,area: web" \
  $'## Problem\nUsers cannot see their own activity in one place.\n\n## Acceptance criteria\n- [ ] /dashboard lists quests where I am owner or worker\n- [ ] Filter by status'

issue "feat(web): pagination / infinite scroll on the browse page" \
  "good first issue,area: web" \
  $'## Problem\nThe browse page loads up to 100 quests at once.\n\n## Acceptance criteria\n- [ ] Page through quests via list_quests(start, limit)\n- [ ] Load-more or infinite scroll'

issue "feat(web): wallet network-mismatch warning banner" \
  "good first issue,area: web" \
  $'## Problem\nUsers on mainnet/futurenet see confusing errors.\n\n## Acceptance criteria\n- [ ] Detect connected network\n- [ ] Banner prompting to switch to Testnet'

issue "feat(web): show tx history & explorer links on quest detail" \
  "good first issue,area: web" \
  $'## Problem\nNo visibility into the on-chain history of a quest.\n\n## Acceptance criteria\n- [ ] List contract events for the quest\n- [ ] Link each to stellar.expert'

issue "feat(server): quest categories & full-text search" \
  "good first issue,area: server" \
  $'## Problem\nNo way to filter/search quests by topic.\n\n## Acceptance criteria\n- [ ] category field + tag filter endpoint\n- [ ] Basic search over title/description'

issue "feat(server): webhook/email notifications on state changes" \
  "area: server" \
  $'## Problem\nUsers must poll to learn about claims/approvals.\n\n## Acceptance criteria\n- [ ] Subscribe endpoint\n- [ ] Notify owner on submit, worker on approve'

issue "test(web): Playwright e2e for post → claim → approve" \
  "Stellar Wave,area: web" \
  $'## Problem\nThe UI flow is only manually verified.\n\n## Acceptance criteria\n- [ ] Playwright spec driving the full happy path against a mocked wallet\n- [ ] Wired into CI'

issue "docs: add a contributor walkthrough (GIF/video) to the README" \
  "good first issue,area: docs" \
  $'## Problem\nNewcomers lack a visual quickstart.\n\n## Acceptance criteria\n- [ ] Short GIF of posting + claiming a quest\n- [ ] Embedded in README'

echo "Done. Seeded contributor issues on $REPO."
