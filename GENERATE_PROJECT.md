# generate_project.py - Documentação

## 📋 Descrição

Arquivo **único e autocontido** que recria **TODO** o repositório do Econometric Lab OS.

## ✅ O que está incluído

### Backend (3 arquivos)
- `backend/server.py` - API FastAPI completa (18KB)
- `backend/requirements.txt` - Todas dependências Python
- `backend/.env` - Variáveis de ambiente

### Frontend (17 arquivos)
- **Páginas:**
  - `LoginPage.jsx` - Sistema de login com 3 usuários
  - `UploadPage.jsx` - Upload CSV + logout
  - `DashboardPage.jsx` - Análise + visualizações + logout
  
- **Componentes:**
  - `ProtectedRoute.jsx` - Proteção de rotas
  
- **Configurações:**
  - `package.json` - Dependências Node.js
  - `tailwind.config.js` - Tailwind CSS
  - `craco.config.js` - CRA config
  - `jsconfig.json` - Path aliases
  - Outros arquivos de config

- **Source:**
  - `App.js` - Rotas principais
  - `index.js` - Entry point
  - `index.css` - Design system
  - `App.css` - Estilos

### Docker (5 arquivos)
- `docker-compose.yml` - Orquestração 3 serviços
- `Dockerfile.backend` - Container Python
- `Dockerfile.frontend` - Container React + Nginx
- `nginx.conf` - Proxy reverso
- `start.sh` - Script de inicialização

### Exemplos (3 arquivos CSV)
- `regressao_linear.csv`
- `dados_painel.csv`
- `serie_temporal.csv`

### Documentação
- `README.md` - Documentação do projeto
- `.gitignore` - Arquivos ignorados

**Total: ~30 arquivos** recriados automaticamente

## 🚀 Como Usar

```bash
# Executar o gerador
python3 generate_project.py

# Responder 's' para sobrescrever (se já existir)
# Ou 'N' para cancelar

# Entrar no diretório criado
cd econometric-lab-os

# Iniciar com Docker
./start.sh

# Acessar
# http://localhost:3000
```

## 👤 Usuários Pré-configurados

| Usuário | Senha | Perfil |
|---------|-------|--------|
| admin | admin123 | Administrador |
| pesquisador | pesquisa2024 | Pesquisador |
| estudante | estudo2024 | Estudante |

## 📊 Estrutura Gerada

```
econometric-lab-os/
├── backend/
│   ├── server.py (18KB - API completa)
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ui/ (vazio, para shadcn)
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── index.css
│   │   └── App.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── [configs]
├── examples/
│   ├── regressao_linear.csv
│   ├── dados_painel.csv
│   └── serie_temporal.csv
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
├── start.sh (executável)
├── README.md
└── .gitignore
```

## 🔧 Características

- ✅ **Autocontido**: Não precisa de arquivos externos
- ✅ **Completo**: Todos os arquivos necessários incluídos
- ✅ **Executável**: Permissões corretas para start.sh
- ✅ **Verificado**: Testado e funcionando
- ✅ **Tamanho**: ~78KB (compacto)

## 📝 Notas Técnicas

### Conteúdo Incluído no Script

O arquivo `generate_project.py` contém:
1. Todo código backend em Python (FastAPI + statsmodels)
2. Todo código frontend em React/JSX
3. Todas configurações Docker
4. Sistema de login completo
5. Arquivos de exemplo CSV
6. Documentação

### Escape de Strings

O script usa `repr()` do Python para garantir escape correto de todos os caracteres especiais, incluindo:
- Aspas simples e duplas
- Quebras de linha
- Caracteres Unicode
- Código JavaScript/JSX

## 🎯 Uso Típico

```bash
# 1. Gerar projeto
python3 generate_project.py

# 2. Navegar
cd econometric-lab-os

# 3. Iniciar
./start.sh

# 4. Acessar navegador
# http://localhost:3000

# 5. Login
# admin / admin123

# 6. Upload CSV
# Usar arquivo de examples/

# 7. Analisar dados
```

## ⚙️ Requisitos

Para executar o projeto gerado:
- Docker 20.10+
- Docker Compose 2.0+
- Portas livres: 3000, 8001, 27017

## 🔍 Verificação

Após executar, verifique:
```bash
cd econometric-lab-os
ls -la

# Deve mostrar:
# - backend/ (3 arquivos)
# - frontend/ (17 arquivos)
# - examples/ (3 arquivos)
# - 5 arquivos Docker
# - README.md
# - start.sh (executável)
```

## 📦 Tamanho dos Arquivos

- generate_project.py: ~78KB
- Projeto gerado: ~90KB (código fonte)
- Com node_modules: ~200MB
- Com Docker images: ~2GB

## ✨ Funcionalidades do Projeto Gerado

1. **Login** com 3 usuários
2. **Upload** de CSV com validação
3. **Análise** econométrica automática
4. **Visualizações** interativas
5. **Exportação** PDF e PNG
6. **Docker** completo para deploy

## 🆘 Solução de Problemas

### Erro: "Diretório já existe"
```bash
# Responda 's' para sobrescrever
# Ou remova manualmente:
rm -rf econometric-lab-os
```

### Erro: "Permission denied" no start.sh
```bash
cd econometric-lab-os
chmod +x start.sh
```

### Verificar integridade
```bash
# Contar arquivos
find econometric-lab-os -type f | wc -l
# Deve retornar: 29-30 arquivos
```

## 📄 Licença

MIT License - O projeto gerado é de domínio público
