# Tabela de Mapeamento de Dados (DE-PARA) - Notion para Dashboard OKR

**Cliente:** `[Nome do Cliente]`
**Data:** `[Data]`

## Objetivo

Esta tabela serve como o artefato central para a adaptação do Dashboard de OKRs. O objetivo é mapear os nomes das propriedades (campos) existentes na base de dados do Notion do cliente (coluna "DE") para os nomes exatos que o sistema do dashboard espera (coluna "PARA").

**Instruções:**

1.  Preencha a coluna **"Nome no Notion do Cliente (DE)"** com os nomes exatos dos campos correspondentes na base de dados do cliente.
2.  Se um campo não existir, marque como **"N/A"** e planeje sua criação no Notion.
3.  A coluna **"Nome Esperado pelo Sistema (PARA)"** é fixa e não deve ser alterada.

---

### Tabela Principal: Ações (Status Updates)

| Nome no Notion do Cliente (DE) | Nome Esperado pelo Sistema (PARA) | Notas / Observações |
| :--- | :--- | :--- |
| | `Updates` | (Propriedade do tipo `Título`) Nome da ação/tarefa. |
| | `Status` | (Propriedade do tipo `Status` ou `Seleção`) Status da ação. |
| | `Date` | (Propriedade do tipo `Data`) Data de conclusão da ação. |
| | `Owner` | (Propriedade do tipo `Seleção`) Responsável pela ação. |
| | `Key Results` | (Propriedade do tipo `Relação`) Vínculo com a tabela de Key Results. |
| | `Prioridade` | (Propriedade do tipo `Seleção`) Prioridade da ação (opcional). |

### Tabela de Relação: Key Results

| Nome no Notion do Cliente (DE) | Nome Esperado pelo Sistema (PARA) | Notas / Observações |
| :--- | :--- | :--- |
| | `Key Result` | (Propriedade do tipo `Título`) Nome do Key Result. |
| | `Related Objective` | (Propriedade do tipo `Relação`) Vínculo com a tabela de Objetivos. |

### Tabela de Relação: Objectives

| Nome no Notion do Cliente (DE) | Nome Esperado pelo Sistema (PARA) | Notas / Observações |
| :--- | :--- | :--- |
| | `Objective` | (Propriedade do tipo `Título`) Nome do Objetivo estratégico. |
