# COMMANDES MANUELLES POUR RÉPARER STRAPI SUR VPS

## Connectez-vous au VPS:
```bash
ssh root@173.212.208.181
```

## Étape 1: Arrêter Strapi
```bash
pkill -f "strapi start"
sleep 3
```

## Étape 2: Aller dans le dossier backend
```bash
cd /root/blog_strapi/backend
```

## Étape 3: Nettoyer le cache et les builds
```bash
rm -rf .cache
rm -rf build  
rm -rf dist
rm -rf public/uploads/.cache
```

## Étape 4: Réinstaller les dépendances
```bash
npm install
```

## Étape 5: Reconstruire l'admin
```bash
NODE_ENV=production npm run build
```

## Étape 6: Redémarrer Strapi
```bash
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=1339

nohup npm run start > /root/strapi.log 2>&1 &
```

## Étape 7: Vérifier que Strapi tourne
```bash
sleep 5
ps aux | grep strapi
```

## Étape 8: Vérifier les logs
```bash
tail -f /root/strapi.log
```

## Étape 9: Tester l'accès
Ouvrez dans votre navigateur:
- http://173.212.208.181:1339/admin

## Si vous devez créer un nouvel admin:
```bash
cd /root/blog_strapi/backend
npm run strapi -- admin:create-user \
  --firstname=Admin \
  --lastname=User \
  --email=admin@example.com \
  --password=SecurePassword123!
```

## Notes:
- Le port est 1339 (pas 1337)
- Les logs sont dans /root/strapi.log
- Le processus tourne en arrière-plan avec nohup
