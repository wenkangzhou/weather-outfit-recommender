#!/bin/bash
URL="https://rzmyyhtqwbigeupxqlhb.supabase.co"
KEY="sb_publishable_rxA94zznUlhjQy6CKUyjjg_RhHbgCnu"

echo "Testing Supabase connection..."

# Test 1: Basic health check
echo -e "\n1. Testing root endpoint:"
curl -s -o /dev/null -w "%{http_code}" "$URL/rest/v1/" -H "apikey: $KEY"

# Test 2: Try to get clothing_items (should return 200 with empty array if table exists)
echo -e "\n\n2. Testing clothing_items table:"
curl -s "$URL/rest/v1/clothing_items?select=*&limit=1" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  -H "Accept: application/json"

# Test 3: Check what tables exist
echo -e "\n\n3. Testing user_preferences table:"
curl -s "$URL/rest/v1/user_preferences?select=*" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  -H "Accept: application/json"

echo -e "\n\nDone!"
