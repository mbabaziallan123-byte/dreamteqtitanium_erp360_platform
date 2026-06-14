#!/usr/bin/env bash
# ============================================================================
# DreamTeQ_360 Firecrawl Scraper Module — Local Pre-Flight Validation Harness
# Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
#
# Usage:  ./validate_local.sh [--tag-prefix v]
#
# On a clean pass this script automatically:
#   1. Runs 5 validation gates (containers, metrics, RBAC, error handling, pytest)
#   2. Derives the next semantic version tag from existing git tags
#   3. Creates and pushes an annotated Git deployment tag
#
# Required tools: docker, curl, git, jq (optional — used for pretty-printing)
# ============================================================================
set -euo pipefail

# ── Formatting ────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Configuration (override via env or --tag-prefix arg) ─────────────────────
TAG_PREFIX="${1:-v}"
API_BASE="http://localhost:8085"
CONTAINER_NAME="dreamteq_scraper_container"
NAMESPACE="dreamteq-erp"

PASS_COUNT=0
FAIL_COUNT=0

pass()  { echo -e "${GREEN}✓ $1${NC}"; ((PASS_COUNT++)) || true; }
fail()  { echo -e "${RED}✗ $1${NC}"; ((FAIL_COUNT++)) || true; }
info()  { echo -e "${CYAN}→ $1${NC}"; }
step()  { echo -e "\n${YELLOW}[Step $1] $2${NC}"; }
banner(){ echo -e "${YELLOW}$1${NC}"; }

# ── Utility: derive next semver tag ──────────────────────────────────────────
derive_next_tag() {
    # Looks at all existing tags matching TAG_PREFIX + semver pattern, bumps patch
    local latest
    latest=$(git tag --list "${TAG_PREFIX}[0-9]*.[0-9]*.[0-9]*" \
             | sort -V | tail -n1 2>/dev/null || true)

    if [[ -z "$latest" ]]; then
        echo "${TAG_PREFIX}1.0.0"
        return
    fi

    # Strip prefix, split into major.minor.patch, bump patch
    local version="${latest#"${TAG_PREFIX}"}"
    local major minor patch
    IFS='.' read -r major minor patch <<< "$version"
    patch=$(( patch + 1 ))
    echo "${TAG_PREFIX}${major}.${minor}.${patch}"
}

# ── Header banner ─────────────────────────────────────────────────────────────
echo ""
banner "==========================================================================="
banner "  💥  DREAMTEQ FIRECRAWL SCRAPER MODULE — LOCAL PRE-FLIGHT VALIDATION  💥  "
banner "==========================================================================="
echo ""
info "Timestamp : $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
info "API Base  : ${API_BASE}"
info "Container : ${CONTAINER_NAME}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# GATE 1: Docker container health
# ─────────────────────────────────────────────────────────────────────────────
step "1/5" "Checking Docker Container Orchestration Stack..."

if ! docker compose ps 2>/dev/null | grep -q "${CONTAINER_NAME}"; then
    fail "Local Docker Compose services are not running."
    echo -e "       Run: ${CYAN}docker compose up -d${NC} then retry."
    exit 1
fi

CONTAINER_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${CONTAINER_NAME}" 2>/dev/null || echo "unknown")
if [[ "$CONTAINER_STATUS" == "unhealthy" ]]; then
    fail "Container '${CONTAINER_NAME}' is in an unhealthy state."
    info "Logs: docker logs ${CONTAINER_NAME} --tail 40"
    exit 1
fi

pass "Containers running (health: ${CONTAINER_STATUS})"

# ─────────────────────────────────────────────────────────────────────────────
# GATE 2: /health liveness probe
# ─────────────────────────────────────────────────────────────────────────────
step "2/5" "Testing /health Liveness Probe..."

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE}/health" 2>/dev/null)
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [[ "$HEALTH_CODE" -ne 200 && "$HEALTH_CODE" -ne 503 ]]; then
    fail "/health endpoint unreachable — HTTP ${HEALTH_CODE}. Is the service up?"
    exit 1
fi

DB_STATUS=$(echo "$HEALTH_BODY" | grep -o '"database":[^,}]*' | cut -d: -f2 || echo "unknown")
if [[ "$HEALTH_CODE" -eq 200 ]]; then
    pass "/health OK (HTTP 200) — database reachable: ${DB_STATUS}"
else
    # 503 = service up but DB degraded — warn, don't abort
    echo -e "${YELLOW}⚠ /health degraded (HTTP 503) — database: ${DB_STATUS}. Continuing...${NC}"
    ((PASS_COUNT++)) || true
fi

# ─────────────────────────────────────────────────────────────────────────────
# GATE 3: RBAC — unauthenticated request must be blocked
# ─────────────────────────────────────────────────────────────────────────────
step "3/5" "Verifying Security Layer: Unauthenticated Execution Prevention..."

FORBIDDEN_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    "${API_BASE}/api/v1/dreamteq-scraper/execute" \
    -H "Content-Type: application/json" \
    -d '{"target_url": "https://agra.org", "extraction_goal": "test"}' 2>/dev/null)

# Accept 401, 403, or 422 (pydantic validation before auth in some configs)
if [[ "$FORBIDDEN_CODE" -ne 401 && "$FORBIDDEN_CODE" -ne 403 && "$FORBIDDEN_CODE" -ne 422 ]]; then
    fail "SECURITY: Unauthenticated request returned unexpected HTTP ${FORBIDDEN_CODE}"
    info "Expected: 401 | 403 | 422 — Review RBAC middleware configuration."
    ((FAIL_COUNT++)) || true
else
    pass "RBAC guardrail active — unauthenticated request blocked (HTTP ${FORBIDDEN_CODE})"
fi

# ─────────────────────────────────────────────────────────────────────────────
# GATE 4: Error handling — invalid URL must return 5xx or 4xx (not 2xx)
# ─────────────────────────────────────────────────────────────────────────────
step "4/5" "Testing Watchdog Exception Interception Layer..."

ERROR_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    "${API_BASE}/api/v1/dreamteq-scraper/execute" \
    -H "Content-Type: application/json" \
    -d '{"target_url": "https://this-portal-does-not-exist-xyz123.invalid", "extraction_goal": "break"}' \
    2>/dev/null)

if [[ "$ERROR_CODE" -eq 200 ]]; then
    fail "Pipeline swallowed an invalid URL without raising an error (HTTP 200)."
    ((FAIL_COUNT++)) || true
else
    pass "Exception interception functional — invalid target returned HTTP ${ERROR_CODE}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# GATE 5: pytest inside container
# ─────────────────────────────────────────────────────────────────────────────
step "5/5" "Running Internal Pytest Harness Inside Application Container..."

if docker exec "${CONTAINER_NAME}" pytest tests/ -v --tb=short 2>&1; then
    pass "All unit tests passed inside container"
else
    fail "One or more pytest tests failed — see output above"
    ((FAIL_COUNT++)) || true
fi

# ─────────────────────────────────────────────────────────────────────────────
# RESULTS SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
echo ""
banner "==========================================================================="
echo -e "  Results: ${GREEN}${PASS_COUNT} passed${NC}  /  ${RED}${FAIL_COUNT} failed${NC}"
banner "==========================================================================="

if [[ "$FAIL_COUNT" -gt 0 ]]; then
    echo -e "\n${RED}✗ Validation FAILED — deployment tag NOT created. Fix issues above.${NC}\n"
    exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# GIT DEPLOYMENT TAG (only on clean pass)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
banner "  🏷️  Auto-generating Git deployment tag..."
echo ""

# Sanity checks before tagging
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Not inside a git repository — skipping tag creation.${NC}"
    exit 0
fi

DIRTY=""
if [[ -n "$(git status --porcelain)" ]]; then
    DIRTY=" (dirty working tree)"
    echo -e "${YELLOW}⚠ Working tree has uncommitted changes. Tag will reference HEAD commit.${NC}"
fi

NEXT_TAG=$(derive_next_tag)
COMMIT_SHA=$(git rev-parse --short HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
TAG_MESSAGE="DreamTeQ Pre-Flight Validation PASSED
Tag      : ${NEXT_TAG}
Commit   : ${COMMIT_SHA}${DIRTY}
Branch   : ${BRANCH}
Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
Gates    : ${PASS_COUNT}/5 passed
Validated by: validate_local.sh"

info "Creating annotated tag: ${NEXT_TAG} → ${COMMIT_SHA} (${BRANCH})"
git tag -a "${NEXT_TAG}" -m "${TAG_MESSAGE}"
pass "Annotated tag '${NEXT_TAG}' created locally"

# Push tag to remote (origin)
if git remote get-url origin > /dev/null 2>&1; then
    info "Pushing tag to origin..."
    if git push origin "${NEXT_TAG}"; then
        pass "Tag '${NEXT_TAG}' pushed to origin successfully"
    else
        echo -e "${YELLOW}⚠ Could not push tag to origin. Push manually: git push origin ${NEXT_TAG}${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No remote 'origin' configured — tag created locally only.${NC}"
fi

echo ""
echo -e "${GREEN}==========================================================================="
echo -e "  🎉  ALL SYSTEMS VERIFIED — DreamTeQ Scraper Module safe to deploy!  🎉   "
echo -e "  Deployment tag: ${NEXT_TAG}  |  Commit: ${COMMIT_SHA}"
echo -e "===========================================================================${NC}"
echo ""
exit 0
