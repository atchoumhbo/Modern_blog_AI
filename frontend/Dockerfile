# Dockerfile multi-étapes pour React Router v7

# Étape des dépendances de développement
FROM node:20-alpine AS development-dependencies-env
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Étape des dépendances de production
FROM node:20-alpine AS production-dependencies-env
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Étape de build
FROM node:20-alpine AS build-env
WORKDIR /app
COPY . .
COPY --from=development-dependencies-env /app/node_modules ./node_modules

# Variables d'environnement pour le build
ARG VITE_API_URL
ARG VITE_BACKEND_TYPE
ARG VITE_BACKEND_URL_SERVER
ARG VITE_GA_MEASUREMENT_ID
ARG VITE_SITE_URL
ARG VITE_SITE_NAME
ARG VITE_LOCALES
ARG VITE_DEFAULT_LOCALE

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_TYPE=$VITE_BACKEND_TYPE
ENV VITE_BACKEND_URL_SERVER=$VITE_BACKEND_URL_SERVER
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_SITE_NAME=$VITE_SITE_NAME
ENV VITE_LOCALES=$VITE_LOCALES
ENV VITE_DEFAULT_LOCALE=$VITE_DEFAULT_LOCALE
ENV NODE_ENV=production

# Build de l'application
RUN npm run build

# Étape de production
FROM node:20-alpine AS production

# Installer des utilitaires système
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S react -u 1001

WORKDIR /app

# Copier les fichiers nécessaires
COPY package*.json ./
COPY --from=production-dependencies-env --chown=react:nodejs /app/node_modules ./node_modules
COPY --from=build-env --chown=react:nodejs /app/build ./build

# Changer vers l'utilisateur non-root
USER react

# Exposer le port
EXPOSE 3000

# Variables d'environnement de production
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Commande de démarrage
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
