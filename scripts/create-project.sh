#!/bin/bash

# Configuration
STRAPI_URL="http://localhost:1337"
API_TOKEN="YOUR_TOKEN_HERE"

# Lire le contenu Markdown (échapper les guillemets)
CONTENT=$(cat ../content-templates/projet-vscode-extension.md | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

# Créer le projet via curl
curl -X POST "$STRAPI_URL/api/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d "{
    \"data\": {
      \"title\": \"Extension VS Code : React Router v7 DevTools\",
      \"slug\": \"vscode-extension-react-router-v7-devtools\",
      \"description\": \"Extension VS Code qui améliore l'expérience de développement avec React Router v7\",
      \"short_description\": \"Extension VS Code pour React Router v7\",
      \"content\": \"$CONTENT\",
      \"technologies\": [\"VS Code API\", \"TypeScript\", \"React\", \"Node.js\"],
      \"status_at\": \"completed\",
      \"start_date\": \"2025-09-01T00:00:00.000Z\",
      \"end_date\": \"2025-11-30T00:00:00.000Z\",
      \"github_url\": \"https://github.com/username/react-router-v7-devtools\",
      \"demo_url\": \"https://marketplace.visualstudio.com/items\",
      \"publishedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"
    }
  }"