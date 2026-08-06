#!/bin/bash
# scripts/test_frontend.sh
# Tests frontend Nuxt web server health and essential routes.

set -e

# Change directory to the root of the project
cd "$(dirname "$0")/.."

echo "=== Clickify Mate Frontend Verification Test ==="

# 1. Check if Nuxt is listening on port 3000
echo -n "[+] Checking if Nuxt is running on port 3000... "
if lsof -i :3000 > /dev/null || curl -s -o /dev/null http://localhost:3000; then
    echo -e "\e[32mPASSED\e[0m"
else
    echo -e "\e[31mFAILED (Nuxt is not listening on port 3000)\e[0m"
    exit 1
fi

# 2. Check Home Route (/)
echo -n "[+] Testing Home Page Route (/) response... "
HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$HOME_STATUS" -eq 200 ]; then
    echo -e "\e[32mPASSED (HTTP 200)\e[0m"
else
    echo -e "\e[31mFAILED (HTTP $HOME_STATUS)\e[0m"
    exit 1
fi

# 3. Check Login Route (/login)
echo -n "[+] Testing Login Page Route (/login) response... "
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login)
if [ "$LOGIN_STATUS" -eq 200 ] || [ "$LOGIN_STATUS" -eq 302 ]; then
    echo -e "\e[32mPASSED (HTTP $LOGIN_STATUS)\e[0m"
else
    echo -e "\e[31mFAILED (HTTP $LOGIN_STATUS)\e[0m"
    exit 1
fi

# 4. Check Dashboard Route (/dashboard) - Should either load (SPA) or redirect to login
echo -n "[+] Testing Dashboard Route (/dashboard) response... "
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
if [ "$DASHBOARD_STATUS" -eq 200 ] || [ "$DASHBOARD_STATUS" -eq 302 ] || [ "$DASHBOARD_STATUS" -eq 307 ]; then
    echo -e "\e[32mPASSED (HTTP $DASHBOARD_STATUS)\e[0m"
else
    echo -e "\e[31mFAILED (HTTP $DASHBOARD_STATUS)\e[0m"
    exit 1
fi

echo -e "\n\e[32m=== All frontend verification tests passed successfully! ===\e[0m"
exit 0
