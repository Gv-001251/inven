#!/bin/bash

# 1. Login to get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "chairwoman@breeze.com", "password": "chairwoman123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed:"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "Token obtained."

# 2. Call the scan endpoint
echo "Scanning for FP-AC-001..."
curl -v -X GET "http://localhost:5001/api/finished-products?barcode=FP-AC-001" \
  -H "Authorization: Bearer $TOKEN"
