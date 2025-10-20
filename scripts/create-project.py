#!/usr/bin/env python3
import requests
import json
import os
from datetime import datetime

# Configuration
STRAPI_URL = "http://localhost:1337"
API_TOKEN = "YOUR_API_TOKEN_HERE"  # À générer dans Strapi

def create_project_from_markdown():
    """Crée un projet Strapi à partir du fichier Markdown"""
    
    # Lire le contenu Markdown
    markdown_path = os.path.join(os.path.dirname(__file__), '..', 'content-templates', 'projet-vscode-extension.md')
    with open(markdown_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Données du projet
    project_data = {
        "data": {
            "title": "Extension VS Code : React Router v7 DevTools",
            "slug": "vscode-extension-react-router-v7-devtools",
            "description": "Extension VS Code qui améliore l'expérience de développement avec React Router v7 en fournissant des outils de navigation, génération de code et debugging.",
            "short_description": "Extension VS Code pour améliorer le développement React Router v7",
            "content": content,
            "technologies": ["VS Code API", "TypeScript", "React", "Node.js", "AST Parsing"],
            "status_at": "completed",
            "start_date": "2025-09-01T00:00:00.000Z",
            "end_date": "2025-11-30T00:00:00.000Z",
            "github_url": "https://github.com/username/react-router-v7-devtools",
            "demo_url": "https://marketplace.visualstudio.com/items?itemName=publisher.react-router-v7-devtools",
            "meta_title": "Extension VS Code : React Router v7 DevTools - Projet",
            "meta_description": "Extension VS Code qui révolutionne le développement avec React Router v7. Outils de debugging, génération de code et navigation avancée.",
            "meta_keywords": "VS Code, React Router, extension, TypeScript, developer tools",
            "publishedAt": datetime.now().isoformat()
        }
    }
    
    # Headers
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_TOKEN}"
    }
    
    try:
        # Appel API
        response = requests.post(
            f"{STRAPI_URL}/api/projects",
            headers=headers,
            json=project_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Projet créé avec succès !")
            print(f"📝 ID: {result['data']['id']}")
            print(f"🔗 Slug: {result['data']['attributes']['slug']}")
            print(f"🌍 URL: http://localhost:5190/projects/{result['data']['attributes']['slug']}")
        else:
            print(f"❌ Erreur {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"💥 Erreur: {e}")

if __name__ == "__main__":
    create_project_from_markdown()