# Script pour voir les logs Strapi et diagnostiquer l'erreur
$VPS_IP = "173.212.208.181"
$VPS_USER = "root"

Write-Host ""
Write-Host "=== DIAGNOSTIC STRAPI - LOGS ===" -ForegroundColor Cyan
Write-Host ""

$sshCommand = @"
cd /root/blog_strapi && 
echo '>>> Logs Strapi (30 dernieres lignes):' && 
docker compose logs --tail=30 blog-strapi
"@

ssh ${VPS_USER}@${VPS_IP} $sshCommand
