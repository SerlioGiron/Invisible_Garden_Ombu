#!/bin/bash

# Clear and repopulate cache with members in correct order

echo "Restarting relayer to clear cache..."
pkill -f "node index.js"
sleep 2

cd /Users/DevEnv/Documents/sandbox/InvisibleGarden/Invisible_Garden_Ombu/relayer
node index.js > ../relayer-output.log 2>&1 &
sleep 3

echo "Adding members in correct order..."

# Member [0]
curl -s -X POST http://localhost:3001/api/admin/add-member \
  -H "Content-Type: application/json" \
  -d '{"groupId":"4","identityCommitment":"12345678901234567890123456789012345678901234567890123456789012345"}' | jq '.identityCommitment,.cacheSize'

# Member [1]
curl -s -X POST http://localhost:3001/api/admin/add-member \
  -H "Content-Type: application/json" \
  -d '{"groupId":"4","identityCommitment":"12172115453413373504381471275319985802432183148308673566777756313253739257126"}' | jq '.identityCommitment,.cacheSize'

# Member [2]
curl -s -X POST http://localhost:3001/api/admin/add-member \
  -H "Content-Type: application/json" \
  -d '{"groupId":"4","identityCommitment":"7775673350682142814992462783452204464709180543992037480055686879747216045852"}' | jq '.identityCommitment,.cacheSize'

# Member [3]
curl -s -X POST http://localhost:3001/api/admin/add-member \
  -H "Content-Type: application/json" \
  -d '{"groupId":"4","identityCommitment":"15808133759445344303670407179359079539347976095435265453719381257123007280539"}' | jq '.identityCommitment,.cacheSize'

echo ""
echo "Verifying cache..."
curl -s http://localhost:3001/api/members/4 | jq '{groupId, size, memberCount: (.members | length), members}'
