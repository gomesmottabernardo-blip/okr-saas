# Guia de Customização Técnica do Dashboard OKR

Este documento detalha os arquivos de código-fonte que precisam ser modificados para adaptar o dashboard às necessidades de um novo cliente. A customização deve ser feita após a conclusão do mapeamento de dados (tabela DE-PARA).

---

## 1. Adaptação do Parser do Notion

O ponto mais crítico da customização é garantir que o sistema consiga ler os dados da estrutura do Notion do cliente.

-   **Arquivo:** `server/notion.ts`
-   **Função Alvo:** `parseNotionPage(page: any): ActionData`

**Procedimento:**

1.  Abra o arquivo `server/notion.ts`.
2.  Localize a função `parseNotionPage`.
3.  Utilizando a tabela DE-PARA como referência, substitua os nomes das propriedades (strings) hardcoded pelos nomes utilizados pelo cliente.

**Exemplo:**

Se o cliente usa o campo "Meta Chave" em vez de "Key Results", a linha de código deve ser alterada:

```typescript
// DE:
const keyResultId = properties["Key Results"]?.relation?.[0]?.id || null;

// PARA:
const keyResultId = properties["Meta Chave"]?.relation?.[0]?.id || null;
```

Repita este processo para todas as propriedades mapeadas na tabela DE-PARA (`Updates`, `Status`, `Date`, `Owner`, etc.).

---

## 2. Ajuste das Regras de Negócio

Se o cliente possuir regras de cálculo de progresso diferentes do padrão, elas devem ser ajustadas.

-   **Arquivo:** `server/okrMetrics.ts`
-   **Funções Alvo:** `calculatePercentual(...)` e `getStatusCategory(...)`

**Procedimento:**

1.  **Ajuste do Cálculo de Percentual:**
    -   Localize a função `calculatePercentual`.
    -   Altere a fórmula `(concluidas + (em_andamento * 0.5))` para refletir a regra do cliente. Por exemplo, se ações "em andamento" não contam para o progresso, a fórmula seria simplesmente `concluidas`.

2.  **Ajuste da Categorização de Status:**
    -   Localize a função `getStatusCategory`.
    -   Adicione ou modifique as condições `if` para corresponder aos nomes de status utilizados pelo cliente (ex: "Em Execução" em vez de "On Track").

---

## 3. Customização Visual (Branding)

Para alinhar o dashboard com a identidade visual do cliente.

-   **Arquivo Principal:** `client/src/pages/Home.tsx`
-   **Arquivo de Estilos:** `client/src/index.css` (para customizações mais profundas)

**Procedimento:**

1.  **Cores:** No arquivo `Home.tsx`, localize as definições de cores (geralmente em hexadecimal, ex: `#10b981`) e substitua-as pelas cores da marca do cliente.
2.  **Textos e Títulos:** Altere os títulos e textos estáticos diretamente no JSX do componente `Home`.
3.  **Logo:** Se houver um logo, adicione o arquivo de imagem à pasta `client/public/` e altere o código JSX para exibi-lo.
