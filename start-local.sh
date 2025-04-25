#!/bin/bash
# Script para rodar frontend e backend juntos
cd "$(dirname "$0")/web"
echo "Iniciando frontend e backend..."
npm run dev:all
