# 📊 Dashboard OKRs - Guia de Uso

## Visão Geral

Dashboard interativo que conecta automaticamente ao Notion e exibe métricas de atingimento de OKRs em tempo real.

## ✨ Funcionalidades

### Seção 1: Indicadores Rápidos
Quatro cards com métricas principais:
- **Total de Objetivos**: Número de objetivos estratégicos mapeados
- **Total de Ações**: Quantidade de ações registradas na tabela
- **Taxa de Atingimento**: Percentual geral de progresso (concluídas + 50% em andamento)
- **Ações em Risco**: Quantidade de ações com status "At Risk"

### Seção 2: Atingimento por Objetivo
Gráfico de barras horizontal mostrando o percentual de atingimento de cada objetivo com sistema de cores:
- 🟢 **Verde** (>70%): On Track - objetivo no caminho certo
- 🟡 **Amarelo** (40-70%): At Risk - objetivo requer atenção
- 🔴 **Vermelho** (<40%): Off Track - objetivo crítico

## 🔄 Atualização Automática

O dashboard atualiza automaticamente a cada 30 segundos, buscando os dados mais recentes da tabela Status Updates do Notion.

## 📱 Responsividade

Interface totalmente responsiva que se adapta a diferentes tamanhos de tela:
- Desktop: visualização completa com gráficos expandidos
- Tablet: layout adaptado com cards em grid
- Mobile: cards empilhados verticalmente

## 🎯 Cálculo de Métricas

### Taxa de Atingimento
```
Taxa = (Concluídas * 100% + Em Andamento * 50%) / Total
```

### Classificação de Status
- **Concluída**: Status "Done" ou "Complete", ou "On Track" com data passada
- **Em Andamento**: Status "On Track" com data futura ou "In Progress"
- **Em Risco**: Status "At Risk"
- **Não Iniciada**: Status "Not Started" ou sem status

### Cores por Percentual
- Verde (On Track): percentual > 70%
- Amarelo (At Risk): 40% ≤ percentual ≤ 70%
- Vermelho (Off Track): percentual < 40%

## 🔗 Integração com Notion

### Estrutura de Dados
O dashboard busca dados da seguinte estrutura:
- **Tabela**: Status Updates (ID: 2c5e7077cffd81e1ba1cdac4b7a9e5a2)
- **Campos utilizados**:
  - `Updates` (título): Nome da ação
  - `Status` (select/status): Status atual (On Track, At Risk, Not Started)
  - `Date` (date): Data da ação
  - `Owner` (select): Responsável pela ação
  - `Key Results` (relation): Relação com Key Results
  
### Relações
- Ações → Key Results → Objectives
- O dashboard busca automaticamente os objetivos através dos Key Results relacionados

## 🚀 Como Usar no Notion

### Opção 1: Embed Direto
1. Copie a URL do dashboard: `https://3000-icda7niqmd7bz7km7xukt-c27a4357.manusvm.computer`
2. Na página de OKRs do Notion, digite `/embed`
3. Cole a URL e confirme
4. Ajuste o tamanho do embed conforme necessário

### Opção 2: Link Externo
1. Adicione um botão ou link na página de OKRs
2. Configure para abrir a URL do dashboard em nova aba
3. O dashboard abrirá em tela cheia

## 🔧 Configuração

### Variáveis de Ambiente
As seguintes variáveis já estão configuradas:
- `NOTION_API_KEY`: Token de integração do Notion
- `NOTION_DATABASE_ID`: ID da tabela Status Updates

### Permissões do Notion
A integração precisa ter acesso a:
- Tabela Status Updates
- Tabela Key Results (para buscar objetivos)
- Tabela Objectives (para buscar nomes dos objetivos)

## 📊 Exemplo de Uso

### Reunião de Acompanhamento
1. Abra o dashboard no início da reunião
2. Revise os indicadores rápidos para visão geral
3. Analise o gráfico por objetivo para identificar prioridades
4. Discuta ações em risco (card vermelho)
5. O dashboard atualiza automaticamente durante a reunião

### Monitoramento Diário
1. Mantenha o dashboard aberto em uma aba
2. Verifique periodicamente os indicadores
3. Atue rapidamente em objetivos que mudarem para amarelo/vermelho

## 🎨 Personalização

### Cores
As cores são definidas no arquivo `client/src/pages/Home.tsx`:
- Verde: `#10b981` (emerald-500)
- Amarelo: `#f59e0b` (amber-500)
- Vermelho: `#ef4444` (red-500)

### Intervalo de Atualização
Configurado em `client/src/pages/Home.tsx` na linha do `setInterval`:
```typescript
const interval = setInterval(() => {
  refetch();
}, 30000); // 30 segundos
```

## 🐛 Troubleshooting

### Dashboard não carrega
- Verifique se a integração do Notion está conectada às páginas corretas
- Confirme que as variáveis de ambiente estão configuradas
- Verifique o console do navegador para erros

### Métricas incorretas
- Verifique se os status estão padronizados (On Track, At Risk, Not Started)
- Confirme que as relações entre Ações → KRs → Objetivos estão corretas
- Verifique se as datas estão no formato correto

### Atualização lenta
- O dashboard busca múltiplas páginas do Notion (ações, KRs, objetivos)
- Primeira carga pode levar 10-15 segundos
- Atualizações subsequentes usam cache parcial

## 📝 Notas Técnicas

### Performance
- Cache de Key Results e Objetivos para reduzir chamadas à API
- Atualização incremental a cada 30 segundos
- Otimizado para até 100 ações simultâneas

### Limitações
- API do Notion tem rate limit de 3 requisições por segundo
- Dashboard pode demorar em bases com muitas ações (>100)
- Requer conexão ativa com internet

## 🔐 Segurança

- Token do Notion armazenado em variável de ambiente segura
- Sem exposição de credenciais no frontend
- Todas as requisições passam pelo backend

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este guia primeiro
2. Consulte a seção de Troubleshooting
3. Entre em contato com o time de desenvolvimento
