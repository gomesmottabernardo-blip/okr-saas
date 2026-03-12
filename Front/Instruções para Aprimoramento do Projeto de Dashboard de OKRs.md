# Instruções para Aprimoramento do Projeto de Dashboard de OKRs

## 1. Contexto do Projeto

Você está recebendo um projeto de software completo que consiste em um **dashboard para visualização de OKRs (Objectives and Key Results)**. Atualmente, o sistema foi desenvolvido para um cliente específico (Mikro Market) e está totalmente integrado a uma única fonte de dados: o **Notion**.

### Arquitetura Atual:

-   **Stack:** Full-stack TypeScript
-   **Frontend (`client/`):** React, Vite, Tailwind CSS, shadcn/ui, e tRPC para chamadas de API seguras.
-   **Backend (`server/`):** Node.js, Express, e tRPC para a criação de endpoints.
-   **Fonte de Dados:** A lógica de busca de dados está concentrada no arquivo `server/notion.ts`, que se comunica diretamente com a API do Notion.
-   **Lógica de Negócio:** O arquivo `server/okrMetrics.ts` consome os dados do `notion.ts` para realizar os cálculos de progresso e status dos OKRs.

O projeto é funcional, bem-estruturado e inclui testes, mas sua principal limitação é o **forte acoplamento com o Notion**.

---

## 2. Objetivo do Aprimoramento

O objetivo é **evoluir e refatorar o código** para que ele possa ser utilizado pela agência **Funil Faixa Preta**. Esta agência gerencia os OKRs de seus clientes em diferentes plataformas.

**Novas Fontes de Dados Requeridas:**

1.  **Notion** (já implementado, mas precisa ser abstraído)
2.  **Trello**
3.  **Google Sheets**

Sua tarefa é re-arquitetar a camada de acesso a dados para que o sistema se torne **agnóstico à fonte de dados**, permitindo que a aplicação se conecte a qualquer uma das três plataformas mencionadas de forma flexível.

---

## 3. Diretrizes Técnicas para a Refatoração

Recomenda-se a aplicação do **Adapter Pattern** (Padrão de Projeto Adaptador) para desacoplar a lógica de negócio da implementação específica de cada API.

### Passo 1: Criar uma Interface de Provedor de Dados

Crie uma interface genérica, por exemplo, `IDataProvider`, que definirá um contrato para todas as fontes de dados. Esta interface deve estar em um arquivo como `server/providers/IDataProvider.ts`.

```typescript
// Exemplo de interface

export interface Action {
    id: string;
    name: string;
    status: 'Done' | 'InProgress' | 'ToDo';
    owner: string;
    dueDate: Date;
    keyResultId: string;
}

export interface KeyResult {
    id: string;
    name: string;
    objectiveId: string;
}

export interface Objective {
    id: string;
    name: string;
}

export interface IDataProvider {
    getActions(): Promise<Action[]>;
    getKeyResults(): Promise<KeyResult[]>;
    getObjectives(): Promise<Objective[]>;
}
```

### Passo 2: Implementar os Adaptadores (Providers)

Crie classes concretas que implementem a interface `IDataProvider` para cada plataforma.

1.  **`NotionProvider.ts`:**
    -   Refatore o código existente em `server/notion.ts` para dentro desta classe.
    -   A classe deve implementar os métodos `getActions`, `getKeyResults`, etc., fazendo as chamadas à API do Notion e **mapeando os resultados** para os modelos unificados (`Action`, `KeyResult`, `Objective`).

2.  **`TrelloProvider.ts` (Nova Implementação):**
    -   Crie esta nova classe.
    -   Utilize a API do Trello para buscar os dados. Um possível mapeamento seria:
        -   **Board:** Representa o conjunto de OKRs.
        -   **Listas (`To Do`, `Doing`, `Done`):** Representam o `status` das ações.
        -   **Cards:** Representam as `Actions`.
        -   **Custom Fields ou Labels nos Cards:** Para vincular um Card (Action) a um Key Result e a um Objective.

3.  **`GoogleSheetsProvider.ts` (Nova Implementação):**
    -   Crie esta nova classe.
    -   Utilize a API do Google Sheets.
    -   Assuma que o cliente terá uma planilha com abas para `Objectives`, `Key Results`, e `Actions`, com colunas bem definidas que possam ser mapeadas para o modelo de dados unificado.

### Passo 3: Refatorar a Lógica de Negócio

Modifique o `server/okrMetrics.ts` para que ele não dependa mais diretamente do `notion.ts`.

-   A lógica de cálculo de métricas deve receber uma instância de `IDataProvider` em seu construtor ou métodos.
-   Isso permitirá que os mesmos cálculos sejam aplicados sobre os dados, independentemente de terem vindo do Notion, Trello ou Google Sheets.

### Passo 4: Implementar uma Fábrica de Provedores (Provider Factory)

Crie um mecanismo (uma função ou classe "Factory") que decida qual `Provider` instanciar com base em uma configuração, que pode ser uma variável de ambiente (ex: `DATA_SOURCE=notion`).

```typescript
// Exemplo de Factory em server/providers/factory.ts

import { IDataProvider } from './IDataProvider';
import { NotionProvider } from './NotionProvider';
import { TrelloProvider } from './TrelloProvider';

export function getDataProvider(): IDataProvider {
    const source = process.env.DATA_SOURCE;

    switch (source) {
        case 'trello':
            return new TrelloProvider();
        case 'google_sheets':
            // return new GoogleSheetsProvider();
        case 'notion':
        default:
            return new NotionProvider();
    }
}
```

---

## 4. Arquivos Fornecidos

Você receberá um arquivo `.zip` contendo:

-   **`codigo_fonte/`**: Todo o código-fonte original do projeto, com a estrutura de pastas `client/` e `server/`.
-   **`documentacao/`**: Documentos de análise e guias que explicam a arquitetura e as funcionalidades em detalhe.
-   **`skill_implantacao/`**: A skill de implementação que formaliza o processo de deploy para novos clientes.

Seu objetivo é usar esses arquivos como base para aplicar a refatoração sugerida. Boa sorte!
