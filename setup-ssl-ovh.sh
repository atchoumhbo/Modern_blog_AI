#!/bin/bash
# 🔒 Configuration SSL avec Certbot + OVH DNS Challenge
# Pour blog.bh-systems.be

set -e

DOMAIN="blog.bh-systems.be"
EMAIL="boujraf.hicham@gmail.com"
OVH_CONFIG="/root/.ovhapi"

echo "=========================================="
echo "🔒 Setup SSL - $DOMAIN"
echo "=========================================="
echo ""

# Étape 1: Installation des outils
echo "[1/5] Installation Certbot + Plugin OVH..."
if ! command -v certbot &> /dev/null; then
    apt update
    apt install -y python3-pip python3-venv
    python3 -m venv /opt/certbot
    /opt/certbot/bin/pip install --upgrade pip
    /opt/certbot/bin/pip install certbot certbot-dns-ovh
    ln -sf /opt/certbot/bin/certbot /usr/local/bin/certbot
    echo "✅ Certbot installé dans venv"
else
    echo "✅ Certbot déjà installé"
fi

# Étape 2: Configuration logrotate
echo ""
echo "[2/5] Configuration logrotate..."
cat > /etc/logrotate.d/certbot <<'EOF'
/var/log/letsencrypt/*.log {
    monthly
    rotate 6
    compress
    delaycompress
    notifempty
    missingok
    create 640 root adm
}
EOF
echo "✅ Logrotate configuré"

# Étape 3: Vérifier la config OVH API
echo ""
echo "[3/5] Vérification config OVH API..."
if [ ! -f "$OVH_CONFIG" ]; then
    echo "❌ ERREUR: Fichier $OVH_CONFIG introuvable!"
    echo ""
    echo "📝 Créez le fichier avec:"
    echo "cat > $OVH_CONFIG <<'EOF'"
    echo "dns_ovh_endpoint = ovh-eu"
    echo "dns_ovh_application_key = VOTRE_APPLICATION_KEY"
    echo "dns_ovh_application_secret = VOTRE_APPLICATION_SECRET"
    echo "dns_ovh_consumer_key = VOTRE_CONSUMER_KEY"
    echo "EOF"
    echo "chmod 600 $OVH_CONFIG"
    echo ""
    echo "🔗 Créer les clés API sur: https://eu.api.ovh.com/createToken/"
    echo ""
    echo "📋 Droits nécessaires:"
    echo "GET /domain/zone/"
    echo "GET /domain/zone/$DOMAIN/"
    echo "GET /domain/zone/$DOMAIN/status"
    echo "GET /domain/zone/$DOMAIN/record"
    echo "GET /domain/zone/$DOMAIN/record/*"
    echo "POST /domain/zone/$DOMAIN/record"
    echo "POST /domain/zone/$DOMAIN/refresh"
    echo "DELETE /domain/zone/$DOMAIN/record/*"
    exit 1
fi

chmod 600 "$OVH_CONFIG"
echo "✅ Config OVH API trouvée"

# Étape 4: Générer le certificat
echo ""
echo "[4/5] Génération certificat SSL..."
echo "⏳ Cela peut prendre 1-2 minutes (challenge DNS)..."
/opt/certbot/bin/certbot certonly \
    --dns-ovh \
    --dns-ovh-credentials "$OVH_CONFIG" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "*.$DOMAIN"

if [ $? -eq 0 ]; then
    echo "✅ Certificat SSL généré avec succès!"
    echo ""
    echo "📁 Certificats disponibles dans:"
    echo "   /etc/letsencrypt/live/$DOMAIN/"
else
    echo "❌ ERREUR lors de la génération du certificat"
    exit 1
fi

# Étape 5: Script de renouvellement
echo ""
echo "[5/5] Création script de renouvellement..."
cat > /usr/local/sbin/renewCerts.sh <<EOF
#!/bin/bash
# Renouvellement automatique des certificats SSL

/opt/certbot/bin/certbot certonly \\
    --dns-ovh \\
    --dns-ovh-credentials "$OVH_CONFIG" \\
    --non-interactive \\
    --agree-tos \\
    --email "$EMAIL" \\
    -d "$DOMAIN" \\
    -d "*.$DOMAIN"

# Recharger Nginx si le certificat a été renouvelé
if [ \$? -eq 0 ]; then
    systemctl reload nginx
    echo "\$(date): Certificat renouvelé et Nginx rechargé" >> /var/log/cert-renewal.log
fi
EOF

chmod +x /usr/local/sbin/renewCerts.sh

# Ajouter à crontab (le 5 de chaque mois à 4h22)
if ! crontab -l 2>/dev/null | grep -q "renewCerts.sh"; then
    (crontab -l 2>/dev/null; echo "22 4 5 * * /usr/local/sbin/renewCerts.sh > /dev/null 2>&1") | crontab -
    echo "✅ Crontab configuré pour renouvellement automatique"
else
    echo "✅ Crontab déjà configuré"
fi

# Résumé
echo ""
echo "=========================================="
echo "✅ CONFIGURATION SSL TERMINÉE!"
echo "=========================================="
echo ""
echo "📋 Informations:"
echo "   Domaine: $DOMAIN"
echo "   Certificat: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "   Clé privée: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "   Email: $EMAIL"
echo ""
echo "🔄 Renouvellement automatique:"
echo "   Script: /usr/local/sbin/renewCerts.sh"
echo "   Cron: Le 5 de chaque mois à 4h22"
echo ""
echo "⚠️  PROCHAINES ÉTAPES:"
echo "   1. Configurer Nginx avec ces certificats"
echo "   2. Redémarrer Nginx: systemctl reload nginx"
echo "   3. Tester HTTPS: https://$DOMAIN"
echo ""
