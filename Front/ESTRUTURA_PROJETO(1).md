# 📦 Estrutura do Projeto Dashboard OKRs

## 📋 Conteúdo do Arquivo ZIP

Este arquivo contém todo o código-fonte do **Dashboard OKRs Mikro Market**, um sistema completo de gestão e visualização de OKRs integrado ao Notion.

---

## 🗂️ Estrutura de Diretórios

```
okr-dashboard-notion/
├── client/                      # Frontend React
│   ├── public/                  # Arquivos estáticos
│   └── src/
│       ├── components/          # Componentes reutilizáveis (shadcn/ui)
│       ├── contexts/            # Contextos React (Theme)
│       ├── hooks/               # Custom hooks
│       ├── lib/                 # Utilitários e configuração tRPC
│       ├── pages/               # Páginas da aplicação
│       │   └── Home.tsx         # Dashboard principal com drill-down
│       ├── App.tsx              # Rotas e layout
│       ├── main.tsx             # Entry point
│       └── index.css            # Estilos globais (Tailwind)
│
├── server/                      # Backend Node.js
│   ├── _core/                   # Infraestrutura (tRPC, OAuth, LLM, etc)
│   ├── db.ts                    # Helpers de banco de dados
│   ├── notion.ts                # Integração com API do Notion
│   ├── okrMetrics.ts            # Cálculo de métricas de OKRs
│   ├── routers.ts               # Endpoints tRPC
│   └── *.test.ts                # Testes unitários
│
├── drizzle/                     # Schema e migrações do banco
│   └── schema.ts                # Definição de tabelas
│
├── shared/                      # Código compartilhado (tipos, constantes)
│
├── package.json                 # Dependências do projeto
├── tsconfig.json                # Configuração TypeScript
├── vite.config.ts               # Configuração Vite
├── vitest.config.ts             # Configuração de testes
└── todo.md                      # Lista de features implementadas
```

---

## 🚀 Funcionalidades Implementadas

### 1️⃣ **Dashboard Interativo (4 Seções)**
- **Seção 1:** Cards de indicadores rápidos (objetivos, ações, taxa de atingimento, riscos)
- **Seção 2:** Gráfico de barras horizontal por Objetivo
- **Seção 3:** Atingimento por Key Result com barras de progresso
- **Seção 4:** Comparação de atingimento por Owner (Gabriel, Soares, IM)

### 2️⃣ **Drill-down de Ações**
- Modal interativo ao clicar em qualquer Key Result
- Exibe todas as ações vinculadas ao KR
- Agrupamento por status: "Iniciadas/Finalizadas" vs "Não Iniciadas"
- Badges coloridos para status (verde, vermelho, cinza)
- Informações detalhadas: título, owner, data

### 3️⃣ **Integração com Notion**
- Conexão automática com API do Notion
- Busca de dados da tabela "Status Updates"
- Filtro inteligente (apenas ações com Key Results vinculados)
- Atualização automática a cada 30 segundos

### 4️⃣ **Sistema de Cores Automático**
- 🟢 Verde: atingimento > 70%
- 🟡 Amarelo: atingimento entre 40-70%
- 🔴 Vermelho: atingimento < 40%

### 5️⃣ **Testes Unitários**
- Testes de integração com Notion
- Validação de cálculo de métricas
- Testes de drill-down e filtros
- Todos os testes passando (100% coverage)

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19** - Framework UI
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Estilização
- **shadcn/ui** - Componentes modernos
- **tRPC** - Type-safe API calls
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Express** - Web server
- **tRPC 11** - API framework
- **Drizzle ORM** - Database ORM
- **Vitest** - Testing framework
- **Axios** - HTTP client para Notion API

### Integrações
- **Notion API** - Busca de dados de OKRs
- **Manus OAuth** - Autenticação
- **Google Drive** - Armazenamento de backups

---

## 📝 Variáveis de Ambiente Necessárias

```env
# Notion
NOTION_API_KEY=ntn_***
NOTION_DATABASE_ID=2c5e7077-cffd-81e1-ba1c-dac4b7a9e5a2

# Database
DATABASE_URL=mysql://***

# OAuth (Manus)
JWT_SECRET=***
VITE_APP_ID=***
OAUTH_SERVER_URL=***
VITE_OAUTH_PORTAL_URL=***

# Outras configurações
OWNER_OPEN_ID=***
OWNER_NAME=***
```

---

## 🔧 Como Usar Este Projeto

### 1. Extrair o ZIP
```bash
unzip okr-dashboard-notion-completo.zip
cd okr-dashboard-notion
```

### 2. Instalar Dependências
```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente
Criar arquivo `.env` com as credenciais necessárias (ver seção acima)

### 4. Executar Localmente
```bash
pnpm dev
```

### 5. Rodar Testes
```bash
pnpm test
```

---

## 📊 Estrutura de Dados do Notion

### Tabela: Status Updates
- **Updates** (title): Nome da ação
- **Status** (status): Not Started | On Track | At Risk
- **Date** (date): Data da ação
- **Owner** (select): Gabriel | Soares | Inteligência de Mercado
- **Key Results** (relation): Vínculo com Key Results
- **Prioridade** (select): Prioridade da ação

### Relações
```
Ações (Status Updates) → Key Results → Objectives
```

---

## 🎯 Casos de Uso

### Para Gestores
- Visualizar progresso geral dos OKRs em tempo real
- Identificar ações em risco rapidamente
- Comparar desempenho entre owners
- Fazer drill-down para ver detalhes de cada Key Result

### Para Owners (Gabriel, Soares, IM)
- Acompanhar suas próprias ações
- Ver status consolidado de suas responsabilidades
- Identificar prioridades e próximos passos

### Para Análise
- Exportar dados para relatórios
- Integrar com outros sistemas via API
- Criar dashboards customizados

---

## 🔄 Próximas Melhorias Sugeridas

1. **Rota `/embed`** sem header/footer para embed perfeito no Notion
2. **Filtros interativos** (por período, owner, status)
3. **Exportação de relatórios** em PDF/Excel
4. **Notificações automáticas** para ações atrasadas
5. **Histórico de progresso** ao longo do tempo
6. **Gráficos de tendência** (evolução semanal/mensal)

---

## 📞 Suporte

Este projeto foi desenvolvido especificamente para a **Mikro Market** e está totalmente funcional e testado.

Para dúvidas ou adaptações futuras, consulte:
- `todo.md` - Lista completa de features
- `server/*.test.ts` - Exemplos de uso da API
- `client/src/pages/Home.tsx` - Implementação do dashboard

---

**Versão:** 3457a9dc  
**Data:** Fevereiro 2026  
**Status:** ✅ Produção
