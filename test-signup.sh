#!/bin/bash

echo "Testing signup API..."
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "name": "Test User",
    "role": "CUSTOMER"
  }' \
  -w "\nStatus: %{http_code}\n"
