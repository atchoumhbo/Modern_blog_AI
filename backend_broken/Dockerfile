# Dockerfile multi-étapes pour Strapi

# Étape de build
FROM node:18-alpine AS build

WORKDIR /opt/app

# Copier les fichiers de package
COPY package*.json ./
COPY yarn.lock* ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY . .

# Variables d'environnement pour le build
ENV NODE_ENV=production

# Build de l'application
RUN npm run build

# Étape de production
FROM node:18-alpine AS production

# Installer des utilitaires système
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S strapi -u 1001

WORKDIR /opt/app

# Copier les fichiers de l'étape de build
COPY --from=build --chown=strapi:nodejs /opt/app/node_modules ./node_modules
COPY --from=build --chown=strapi:nodejs /opt/app/dist ./dist
COPY --from=build --chown=strapi:nodejs /opt/app/build ./build
COPY --from=build --chown=strapi:nodejs /opt/app/public ./public
COPY --from=build --chown=strapi:nodejs /opt/app/package*.json ./

# Créer les dossiers nécessaires
RUN mkdir -p /opt/app/public/uploads && \
    mkdir -p /opt/app/data && \
    chown -R strapi:nodejs /opt/app

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