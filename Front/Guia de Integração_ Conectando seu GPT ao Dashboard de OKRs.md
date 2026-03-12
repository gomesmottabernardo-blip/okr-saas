# Guia de Integração: Conectando seu GPT ao Dashboard de OKRs

Este documento explica como conectar seu assistente GPT customizado à API do nosso projeto de Dashboard de OKRs, permitindo que ele consulte os dados de progresso em tempo real.

---

## 1. Como Funciona a Integração

A integração que vamos configurar é **unidirecional**. Isso significa que:

-   **Seu GPT poderá LER dados do nosso projeto:** Ele poderá chamar uma API para obter as métricas de OKRs (ex: "Qual o progresso do objetivo 'Lançar novo produto'?").
-   **Seu GPT NÃO poderá controlar o Manus:** Ele não terá a capacidade de me dar ordens, modificar arquivos ou executar ações dentro do meu ambiente. A conexão é apenas para consulta de dados.

Para que isso funcione, eu (Manus) atuarei como o **host temporário** da API do nosso projeto. O processo é o seguinte:

1.  Eu iniciarei o servidor backend do projeto OKRs no meu ambiente.
2.  Eu gerarei uma URL pública e temporária para este servidor.
3.  Você usará essa URL e uma chave de API para configurar a "Ação" no seu GPT.

> **Importante:** Esta URL é temporária e só funcionará enquanto eu estiver ativo nesta tarefa. Para uma solução permanente, o backend do projeto precisaria ser implantado em um serviço de hospedagem como Vercel, Netlify ou AWS.

---

## 2. O Schema OpenAPI

O arquivo `openapi_schema.yaml` que preparei descreve a API para o seu GPT. Ele define um único endpoint:

-   **Endpoint:** `GET /metrics`
-   **Função:** Retorna o nome e o percentual de progresso de todos os Objetivos e seus respectivos Key Results.
-   **Autenticação:** Requer uma chave de API (`X-API-Key`) no cabeçalho da requisição para segurança.

Você precisará copiar o conteúdo deste arquivo e colar na seção "Schema" do GPT Builder, mas **somente após atualizar a URL do servidor**, conforme o próximo passo.

---

## 3. Próximos Passos (O que faremos agora)

Para colocar a integração no ar, siga estas instruções:

1.  **Aguarde:** Eu vou agora iniciar o servidor e gerar a URL pública e a chave de API.
2.  **Receba os Dados:** Eu enviarei uma mensagem com a **URL do Servidor** e a **Chave de API (API Key)**.
3.  **Atualize o Schema:** Você vai copiar a URL que eu fornecer e colar no campo `url` dentro do arquivo `openapi_schema.yaml`.
4.  **Configure o GPT:**
    -   Copie o **conteúdo completo e atualizado** do `openapi_schema.yaml`.
    -   Cole na caixa de texto "Schema" na tela do seu GPT Builder.
    -   Na seção "Autenticação", selecione "API Key". Preencha os campos com a `X-API-Key` e selecione a opção "Header".

Após esses passos, seu assistente estará pronto para consultar as métricas do projeto!
