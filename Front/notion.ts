import axios from "axios";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_API_VERSION = "2022-06-28";

if (!NOTION_API_KEY) {
  throw new Error("NOTION_API_KEY is not set");
}

if (!NOTION_DATABASE_ID) {
  throw new Error("NOTION_DATABASE_ID is not set");
}

const notionClient = axios.create({
  baseURL: "https://api.notion.com/v1",
  headers: {
    "Authorization": `Bearer ${NOTION_API_KEY}`,
    "Notion-Version": NOTION_API_VERSION,
    "Content-Type": "application/json",
  },
});

export interface NotionDatabaseResponse {
  results: any[];
  has_more: boolean;
  next_cursor: string | null;
}

export async function fetchNotionDatabase(): Promise<NotionDatabaseResponse> {
  try {
    // Filtrar apenas ações que têm Key Results associados
    const response = await notionClient.post(
      `/databases/${NOTION_DATABASE_ID}/query`,
      {
        filter: {
          property: "Key Results",
          relation: {
            is_not_empty: true
          }
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Notion API Error:", error.response?.data || error.message);
      throw new Error(`Failed to fetch Notion database: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

export async function fetchNotionPage(pageId: string): Promise<any> {
  try {
    const response = await notionClient.get(`/pages/${pageId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Notion API Error:", error.response?.data || error.message);
      return null;
    }
    return null;
  }
}

export interface ActionData {
  id: string;
  title: string;
  status: string;
  date: string | null;
  owner: string | null;
  companyObjective: string | null;
  keyResultId: string | null;
  priority: string | null;
}

export function parseNotionPage(page: any): ActionData {
  const properties = page.properties;
  
  // Extract title from Updates property
  const title = properties.Updates?.title?.[0]?.plain_text || "Sem título";
  
  // Extract status (pode ser status ou select dependendo da configuração)
  const status = properties.Status?.status?.name || properties.Status?.select?.name || "Not Started";
  
  // Extract date
  const date = properties.Date?.date?.start || null;
  
  // Extract owner
  const owner = properties.Owner?.select?.name || null;
  
  // Extract Key Result ID
  const keyResultId = properties["Key Results"]?.relation?.[0]?.id || null;
  
  // Extract priority
  const priority = properties.Prioridade?.select?.name || null;
  
  return {
    id: page.id,
    title,
    status,
    date,
    owner,
    companyObjective: null, // Will be filled later
    keyResultId,
    priority,
  };
}

// Cache de Key Results e Objetivos para evitar múltiplas chamadas
const keyResultsCache = new Map<string, string>();
const objectivesCache = new Map<string, string>();

export async function getAllActions(): Promise<ActionData[]> {
  const response = await fetchNotionDatabase();
  const actions = response.results.map(parseNotionPage);
  
  // Buscar Key Results únicos
  const keyResultIds = new Set(
    actions
      .map(action => action.keyResultId)
      .filter(id => id !== null) as string[]
  );
  
  // Buscar Key Results que não estão no cache
  for (const krId of Array.from(keyResultIds)) {
    if (!keyResultsCache.has(krId)) {
      const krPage = await fetchNotionPage(krId);
      if (krPage) {
        // Buscar o objetivo relacionado ao KR
        const objectiveId = krPage.properties?.["Related Objective"]?.relation?.[0]?.id;
        if (objectiveId) {
          // Buscar o objetivo se não estiver no cache
          if (!objectivesCache.has(objectiveId)) {
            const objectivePage = await fetchNotionPage(objectiveId);
            if (objectivePage) {
              const objectiveTitle = objectivePage.properties?.Objective?.title?.[0]?.plain_text || "Sem objetivo";
              objectivesCache.set(objectiveId, objectiveTitle);
            }
          }
          
          // Mapear KR → Objetivo
          const objectiveTitle = objectivesCache.get(objectiveId) || "Sem objetivo";
          keyResultsCache.set(krId, objectiveTitle);
        }
      }
    }
  }
  
  // Preencher objetivos nas ações
  for (const action of actions) {
    if (action.keyResultId) {
      action.companyObjective = keyResultsCache.get(action.keyResultId) || "Sem objetivo";
    } else {
      action.companyObjective = "Sem objetivo";
    }
  }
  
  return actions;
}

export async function getKeyResultName(keyResultId: string): Promise<string> {
  // Verificar se já está no cache
  if (keyResultsCache.has(keyResultId)) {
    // O cache armazena o nome do objetivo, não do KR
    // Precisamos buscar o nome do KR da página
  }
  
  const krPage = await fetchNotionPage(keyResultId);
  if (!krPage) {
    return "Key Result";
  }
  
  const krName = krPage.properties?.["Key Result"]?.title?.[0]?.plain_text || "Key Result";
  return krName;
}
