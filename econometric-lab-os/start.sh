#!/bin/bash
echo "Iniciando Econometric Lab OS..."
docker-compose up --build -d
sleep 5
echo ""
echo "✅ Rodando!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8001"
echo ""
echo "Usuários: admin/admin123, pesquisador/pesquisa2024, estudante/estudo2024"
