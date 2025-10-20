# Dockerfile multi-étapes pour Strapi

# Étape de build
FROM node:20-alpine AS build

WORKDIR /opt/app

# Installer les dépendances nécessaires pour better-sqlite3 et autres modules natifs
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev \
    pkgconfig \
    sqlite-dev \
    && rm -rf /var/cache/apk/*

# Copier les fichiers de package
COPY package*.json ./

# Installer TOUTES les dépendances (y compris dev) pour le build
RUN npm install && npm cache clean --force

# IMPORTANT: Installer ts-node et @types/node comme dépendances normales (pas -D)
# Car Strapi v5 charge les fichiers .ts en production via ts-node
RUN npm install ts-node @types/node

# Copier le code source
COPY . .

# Créer le dossier public s'il n'existe pas (pour robots.txt, etc.)
RUN mkdir -p public

# Variables d'environnement pour le build
ENV NODE_ENV=development

# Build de l'application avec l'admin panel
# Cela compile aussi les fichiers TypeScript
RUN npm run build

# NE PAS installer only=production ici car on a besoin de TypeScript
# Strapi v5 peut charger directement les fichiers .ts en production
# On garde toutes les dépendances pour que ts-node puisse fonctionner

# Étape de production
FROM node:20-alpine AS production

# Installer des utilitaires système et SQLite
RUN apk add --no-cache \
    curl \
    dumb-init \
    sqlite \
    && rm -rf /var/cache/apk/*

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S strapi -u 1001

WORKDIR /opt/app

# Copier les fichiers de l'étape de build
COPY --from=build --chown=strapi:nodejs /opt/app/node_modules ./node_modules
COPY --from=build --chown=strapi:nodejs /opt/app/dist ./dist
COPY --from=build --chown=strapi:nodejs /opt/app/package*.json ./
COPY --from=build --chown=strapi:nodejs /opt/app/tsconfig.json ./tsconfig.json

# Copier les autres fichiers s'ils existent
COPY --from=build --chown=strapi:nodejs /opt/app/src ./src
COPY --from=build --chown=strapi:nodejs /opt/app/config ./config
COPY --from=build --chown=strapi:nodejs /opt/app/database ./database

# Créer les dossiers nécessaires AVANT de copier public
RUN mkdir -p /opt/app/public/uploads && \
    mkdir -p /opt/app/data && \
    chown -R strapi:nodejs /opt/app

# Copier public (robots.txt, etc.) - le dossier existe maintenant grâce au RUN mkdir dans build
COPY --from=build --chown=strapi:nodejs /opt/app/public ./public

# Assurer que les permissions sont correctes
RUN chown -R strapi:nodejs /opt/app

# Changer vers l'utilisateur non-root
USER strapi

# Exposer le port
EXPOSE 1337

# Variables d'environnement
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:1337/_health || exit 1

# Commande de démarrage avec dumb-init pour une gestion propre des signaux
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]