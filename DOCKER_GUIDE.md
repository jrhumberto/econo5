# Guia Rápido de Uso - Docker

## Iniciar a Aplicação

### Método 1: Usando o script automatizado
```bash
./start.sh
```

### Método 2: Comandos manuais
```bash
# Construir e iniciar todos os serviços
docker-compose up --build -d

# Ver logs em tempo real
docker-compose logs -f
```

## Acessar a Aplicação

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **Documentação API (Swagger):** http://localhost:8001/docs

## Gerenciar os Serviços

### Ver status dos containers
```bash
docker-compose ps
```

### Ver logs
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Parar os serviços
```bash
docker-compose down
```

### Parar e remover volumes (dados do MongoDB)
```bash
docker-compose down -v
```

### Reiniciar um serviço específico
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Reconstruir após mudanças no código
```bash
docker-compose up --build --force-recreate
```

## Troubleshooting

### Portas já em uso
Se as portas 3000, 8001 ou 27017 já estiverem em uso, você pode modificar no `docker-compose.yml`:

```yaml
ports:
  - "3001:80"     # Frontend em 3001 em vez de 3000
  - "8002:8001"   # Backend em 8002 em vez de 8001
  - "27018:27017" # MongoDB em 27018 em vez de 27017
```

### Container não inicia
```bash
# Ver logs detalhados
docker-compose logs backend
docker-compose logs frontend

# Reconstruir do zero
docker-compose down -v
docker-compose up --build
```

### Limpar tudo e recomeçar
```bash
# Parar e remover tudo
docker-compose down -v

# Remover imagens antigas
docker-compose rm -f

# Reconstruir
docker-compose up --build
```

## Desenvolvimento

### Executar apenas o backend
```bash
docker-compose up mongodb backend
```

### Executar apenas o frontend
```bash
docker-compose up frontend
```

### Acessar o shell de um container
```bash
# Backend
docker-compose exec backend bash

# Frontend (nginx)
docker-compose exec frontend sh

# MongoDB
docker-compose exec mongodb mongosh
```

## Arquitetura

```
┌─────────────────────────────────────────┐
│          Usuário (Browser)              │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────▼───────────┐
      │   Frontend (React)    │
      │   Porta: 3000         │
      │   Nginx + Build       │
      └───────────┬───────────┘
                  │
      ┌───────────▼───────────┐
      │  Backend (FastAPI)    │
      │  Porta: 8001          │
      │  Python + statsmodels │
      └───────────┬───────────┘
                  │
      ┌───────────▼───────────┐
      │    MongoDB            │
      │    Porta: 27017       │
      │    Base de dados      │
      └───────────────────────┘
```

## Produção

Para deploy em produção, ajuste as seguintes variáveis:

### docker-compose.yml
```yaml
# Adicionar em frontend > build > args
- REACT_APP_BACKEND_URL=https://sua-api.com

# Ajustar CORS no backend
environment:
  - CORS_ORIGINS=https://seu-dominio.com
```

### Usar arquivo .env
Crie um arquivo `.env` na raiz:
```
BACKEND_URL=https://sua-api.com
FRONTEND_PORT=80
BACKEND_PORT=8001
```

E ajuste docker-compose.yml:
```yaml
ports:
  - "${FRONTEND_PORT}:80"
  - "${BACKEND_PORT}:8001"
```

## Recursos Adicionais

- **Documentação completa:** Ver README.md
- **Exemplos de CSV:** Ver diretório /examples
- **Testes:** docker-compose exec backend pytest
