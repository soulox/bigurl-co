#!/usr/bin/env bash
set -euo pipefail

# Test script for quick wins
# Run this on the server after deploying changes

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Testing Quick Wins Implementation"
echo "======================================"
echo ""

# Test 1: Docker Compose version warning
echo -e "${YELLOW}Test 1: Docker Compose Version Warning${NC}"
if docker compose version 2>&1 | grep -q "version"; then
  if docker compose config 2>&1 | grep -q "obsolete"; then
    echo -e "${RED}✗ FAIL: Version warning still present${NC}"
  else
    echo -e "${GREEN}✓ PASS: No version warning${NC}"
  fi
else
  echo -e "${GREEN}✓ PASS: Docker Compose working${NC}"
fi
echo ""

# Test 2: Services are running
echo -e "${YELLOW}Test 2: Services Health${NC}"
SERVICES=("bigurl-co-server-1" "bigurl-co-next-1" "bigurl-co-nginx-1")
for service in "${SERVICES[@]}"; do
  if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
    STATUS=$(docker inspect --format='{{.State.Status}}' "$service")
    if [ "$STATUS" = "running" ]; then
      echo -e "${GREEN}✓ PASS: $service is running${NC}"
    else
      echo -e "${RED}✗ FAIL: $service status: $STATUS${NC}"
    fi
  else
    echo -e "${RED}✗ FAIL: $service not found${NC}"
  fi
done
echo ""

# Test 3: Health endpoints
echo -e "${YELLOW}Test 3: Health Endpoints${NC}"
if curl -sf http://localhost/health > /dev/null; then
  echo -e "${GREEN}✓ PASS: Main health endpoint responding${NC}"
else
  echo -e "${RED}✗ FAIL: Main health endpoint not responding${NC}"
fi

if docker exec bigurl-co-server-1 wget -qO- http://localhost:3000/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASS: Server health endpoint responding${NC}"
else
  echo -e "${RED}✗ FAIL: Server health endpoint not responding${NC}"
fi
echo ""

# Test 4: API functionality
echo -e "${YELLOW}Test 4: API Functionality${NC}"
RESPONSE=$(curl -sS -X POST http://localhost/api/shorten \
  -H "content-type: application/json" \
  -d '{"url":"https://example.com/test"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ PASS: API returns 200${NC}"
  SHORT_CODE=$(echo "$BODY" | grep -o '"shortCode":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$SHORT_CODE" ]; then
    echo -e "${GREEN}✓ PASS: Short code generated: $SHORT_CODE${NC}"
    
    # Test redirect
    REDIRECT_CODE=$(curl -sL -w "%{http_code}" -o /dev/null http://localhost/$SHORT_CODE)
    if [ "$REDIRECT_CODE" = "200" ]; then
      echo -e "${GREEN}✓ PASS: Redirect works${NC}"
    else
      echo -e "${RED}✗ FAIL: Redirect returned $REDIRECT_CODE${NC}"
    fi
  else
    echo -e "${RED}✗ FAIL: No short code in response${NC}"
  fi
else
  echo -e "${RED}✗ FAIL: API returned $HTTP_CODE${NC}"
  echo "Response: $BODY"
fi
echo ""

# Test 5: Rate limiting
echo -e "${YELLOW}Test 5: Rate Limiting${NC}"
echo "Testing API rate limit (10 req/s, burst 20)..."
RATE_LIMITED=0
for i in {1..25}; do
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST http://localhost/api/shorten \
    -H "content-type: application/json" \
    -d '{"url":"https://example.com/rate-test-'"$i"'"}')
  if [ "$CODE" = "429" ]; then
    RATE_LIMITED=$((RATE_LIMITED + 1))
  fi
done

if [ $RATE_LIMITED -gt 0 ]; then
  echo -e "${GREEN}✓ PASS: Rate limiting working ($RATE_LIMITED requests blocked)${NC}"
else
  echo -e "${YELLOW}⚠ WARNING: No rate limiting detected (may need faster requests)${NC}"
fi
echo ""

# Test 6: Nginx cache headers
echo -e "${YELLOW}Test 6: Nginx Cache Headers${NC}"
if curl -sI http://localhost/api/shorten | grep -q "X-Cache-Status"; then
  echo -e "${GREEN}✓ PASS: Cache headers present${NC}"
else
  echo -e "${YELLOW}⚠ WARNING: X-Cache-Status header not found${NC}"
fi
echo ""

# Test 7: Database backup script exists and is executable
echo -e "${YELLOW}Test 7: Backup Scripts${NC}"
if [ -f "scripts/backup-db.sh" ]; then
  echo -e "${GREEN}✓ PASS: backup-db.sh exists${NC}"
  if [ -x "scripts/backup-db.sh" ]; then
    echo -e "${GREEN}✓ PASS: backup-db.sh is executable${NC}"
  else
    echo -e "${YELLOW}⚠ WARNING: backup-db.sh not executable (run: chmod +x scripts/backup-db.sh)${NC}"
  fi
else
  echo -e "${RED}✗ FAIL: backup-db.sh not found${NC}"
fi

if [ -f "scripts/setup-backup-cron.sh" ]; then
  echo -e "${GREEN}✓ PASS: setup-backup-cron.sh exists${NC}"
else
  echo -e "${RED}✗ FAIL: setup-backup-cron.sh not found${NC}"
fi
echo ""

# Test 8: .dockerignore files
echo -e "${YELLOW}Test 8: .dockerignore Files${NC}"
if [ -f ".dockerignore" ]; then
  echo -e "${GREEN}✓ PASS: Root .dockerignore exists${NC}"
else
  echo -e "${RED}✗ FAIL: Root .dockerignore not found${NC}"
fi

if [ -f "server/.dockerignore" ]; then
  echo -e "${GREEN}✓ PASS: server/.dockerignore exists${NC}"
else
  echo -e "${RED}✗ FAIL: server/.dockerignore not found${NC}"
fi
echo ""

# Test 9: README updated
echo -e "${YELLOW}Test 9: README Documentation${NC}"
if grep -q "BigURL - Modern URL Shortener" README.md; then
  echo -e "${GREEN}✓ PASS: README updated with project info${NC}"
else
  echo -e "${RED}✗ FAIL: README not updated${NC}"
fi

if grep -q "Rate Limits" README.md; then
  echo -e "${GREEN}✓ PASS: README includes rate limit docs${NC}"
else
  echo -e "${YELLOW}⚠ WARNING: Rate limit docs not in README${NC}"
fi
echo ""

# Test 10: Error handling improvements (manual test needed)
echo -e "${YELLOW}Test 10: Error Handling (Manual Test Required)${NC}"
echo "Please test in browser:"
echo "1. Try creating a link with duplicate custom slug"
echo "2. Try copying a short URL (should show visual feedback)"
echo "3. Trigger rate limit and check error message"
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo "Review the results above."
echo ""
echo "Next steps:"
echo "1. Fix any FAIL items"
echo "2. Investigate WARNING items"
echo "3. Test manually in browser"
echo "4. Run: bash scripts/backup-db.sh (test backup)"
echo "5. Setup cron: bash scripts/setup-backup-cron.sh"

