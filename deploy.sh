#!/bin/bash
# Script de déploiement sur Ionos
# Usage: ./deploy.sh

echo "=== Déploiement sur Ionos ==="
echo ""

# 1. Build du projet
echo "[1/3] Build du projet..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERREUR: Le build a échoué"
    exit 1
fi
echo "Build terminé avec succès"
echo ""

# 2. Copie sur Ionos
echo "[2/3] Copie des fichiers sur Ionos..."
pscp -P 22 -l root -pw Thk6tD56BuVcEM -r dist/* 212.227.93.180:/var/www/AnimateJS/
if [ $? -ne 0 ]; then
    echo "ERREUR: La copie a échoué"
    exit 1
fi
echo "Fichiers copiés avec succès"
echo ""

# 3. Push sur GitHub
echo "[3/3] Push sur GitHub..."
git push origin master
if [ $? -ne 0 ]; then
    echo "ERREUR: Le push sur GitHub a échoué"
    exit 1
fi
echo "Push sur GitHub terminé avec succès"
echo ""

echo "=== Déploiement terminé ==="
echo "URL: http://212.227.93.180/AnimateJS"
