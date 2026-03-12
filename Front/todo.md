# Dashboard OKRs - TODO

## Features Planejadas

### Backend
- [x] Configurar integração com API do Notion
- [x] Criar endpoint para buscar dados da tabela Status Updates
- [x] Implementar cálculo de métricas de atingimento
- [x] Criar lógica de classificação por cores (verde/amarelo/vermelho)
- [x] Implementar cache para otimizar performance

### Frontend
- [x] Criar página do dashboard com layout responsivo
- [x] Implementar Seção 1: Cards de indicadores rápidos
- [x] Implementar Seção 2: Gráfico de barras por Objetivo
- [x] Aplicar sistema de cores automático
- [x] Adicionar auto-refresh para atualização automática
- [x] Otimizar para embed no Notion

### Testes e Deploy
- [x] Testar integração com Notion
- [x] Validar cálculos de métricas
- [x] Testar responsividade
- [x] Criar checkpoint final
- [x] Documentar uso e configuração

## Novas Features - Seções 3 e 4

### Backend
- [x] Adicionar métricas por Key Result no cálculo
- [x] Buscar nomes dos Key Results da API do Notion
- [x] Agrupar ações por Key Result

### Frontend
- [x] Implementar Seção 3: Atingimento por Key Result
- [x] Criar visualização com barras de progresso por KR
- [x] Agrupar KRs por objetivo
- [x] Implementar Seção 4: Atingimento por Owner
- [x] Criar cards comparativos entre owners
- [x] Adicionar gráfico de comparação

### Testes
- [x] Testar cálculo de métricas por KR
- [x] Validar visualizações das novas seções
- [x] Criar checkpoint final

## Bugs e Melhorias

### Bug: Contagem Incorreta de Ações
- [x] Investigar por que está mostrando 59 ações ao invés de 39
- [x] Verificar se há duplicação de ações na busca
- [x] Corrigir lógica de contagem no backend (filtrar por Key Results)
- [x] Validar contagem com dados do Notion

### Feature: Drill-down de Ações por KR
- [x] Criar modal/painel para exibir ações de um KR
- [x] Adicionar evento de clique no KR e na barra de progresso
- [x] Exibir lista de ações com: nome, status, owner, data
- [x] Agrupar ações por status (iniciadas/finalizadas vs não iniciadas)
- [x] Testar funcionalidade de drill-down
