import axios, { AxiosInstance } from 'axios';
import { IDataProvider } from './IDataProvider';
import { Company } from '../domain/Company';
import { Action, KeyResult, Objective } from '../domain/models';

const NOTION_API_VERSION = '2022-06-28';

// ─── Tipos internos da resposta da API do Notion ─────────────────────────────

interface NotionPage {
  id: string;
  properties: Record<string, any>;
}

interface NotionDatabaseResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

// ─── Mapeamento de status Notion → domínio ───────────────────────────────────

function mapNotionStatusToDomain(
  rawStatus: string,
  dueDate: Date
): Action['status'] {
  const s = rawStatus.toLowerCase();

  if (s.includes('done') || s.includes('complete')) {
    return 'Done';
  }

  // "On Track" com data passada é tratado como concluído
  if (s.includes('on track')) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) return 'Done';
    return 'InProgress';
  }

  if (s.includes('in progress') || s.includes('at risk')) {
    return 'InProgress';
  }

  return 'ToDo';
}

// ─── Classe principal ─────────────────────────────────────────────────────────

export class NotionProvider implements IDataProvider {
  private client: AxiosInstance;

  // Caches para evitar múltiplas chamadas à API do Notion
  private keyResultsCache = new Map<string, { name: string; objectiveId: string }>();
  private objectivesCache = new Map<string, string>();

  constructor(private config: Company['config']) {
    if (!config.apiKey) {
      throw new Error('NotionProvider: apiKey é obrigatório na configuração da empresa.');
    }

    this.client = axios.create({
      baseURL: 'https://api.notion.com/v1',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Notion-Version': NOTION_API_VERSION,
        'Content-Type': 'application/json',
      },
    });
  }

  // ─── Métodos privados de acesso à API ──────────────────────────────────────

  private async fetchDatabase(): Promise<NotionDatabaseResponse> {
    try {
      const response = await this.client.post(
        `/databases/${this.config.databaseId}/query`,
        {
          filter: {
            property: 'Key Results',
            relation: { is_not_empty: true },
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `NotionProvider: falha ao buscar banco de dados — ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  private async fetchPage(pageId: string): Promise<NotionPage | null> {
    try {
      const response = await this.client.get(`/pages/${pageId}`);
      return response.data;
    } catch {
      return null;
    }
  }

  // ─── Pré-carregamento de Key Results e Objetivos ───────────────────────────

  private async preloadKeyResultsAndObjectives(krIds: string[]): Promise<void> {
    for (const krId of krIds) {
      if (this.keyResultsCache.has(krId)) continue;

      const krPage = await this.fetchPage(krId);
      if (!krPage) continue;

      const krName =
        krPage.properties?.['Key Result']?.title?.[0]?.plain_text || 'Key Result';
      const objectiveId =
        krPage.properties?.['Related Objective']?.relation?.[0]?.id || null;

      if (objectiveId) {
        if (!this.objectivesCache.has(objectiveId)) {
          const objPage = await this.fetchPage(objectiveId);
          if (objPage) {
            const objName =
              objPage.properties?.Objective?.title?.[0]?.plain_text || 'Sem objetivo';
            this.objectivesCache.set(objectiveId, objName);
          }
        }
        this.keyResultsCache.set(krId, { name: krName, objectiveId });
      }
    }
  }

  // ─── Implementação de IDataProvider ────────────────────────────────────────

  async getActions(company: Company): Promise<Action[]> {
    const response = await this.fetchDatabase();

    // Coletar IDs únicos de Key Results para pré-carregar
    const krIds = [
      ...new Set(
        response.results
          .map((p) => p.properties?.['Key Results']?.relation?.[0]?.id as string | undefined)
          .filter((id): id is string => !!id)
      ),
    ];

    await this.preloadKeyResultsAndObjectives(krIds);

    return response.results.map((page): Action => {
      const props = page.properties;

      const rawStatus =
        props.Status?.status?.name || props.Status?.select?.name || 'Not Started';
      const rawDate = props.Date?.date?.start || null;
      const dueDate = rawDate ? new Date(rawDate) : new Date();

      const status = mapNotionStatusToDomain(rawStatus, dueDate);
      const owner = props.Owner?.select?.name || 'Sem owner';
      const keyResultId = props['Key Results']?.relation?.[0]?.id || '';

      return {
        id: page.id,
        name: props.Updates?.title?.[0]?.plain_text || 'Sem título',
        status,
        owner,
        dueDate,
        keyResultId,
      };
    });
  }

  async getKeyResults(company: Company): Promise<KeyResult[]> {
    // Garantir que o cache esteja populado buscando as ações primeiro
    if (this.keyResultsCache.size === 0) {
      await this.getActions(company);
    }

    return Array.from(this.keyResultsCache.entries()).map(
      ([id, { name, objectiveId }]): KeyResult => ({
        id,
        name,
        objectiveId,
      })
    );
  }

  async getObjectives(company: Company): Promise<Objective[]> {
    // Garantir que o cache esteja populado
    if (this.objectivesCache.size === 0) {
      await this.getActions(company);
    }

    return Array.from(this.objectivesCache.entries()).map(
      ([id, name]): Objective => ({ id, name })
    );
  }

  // ─── Método auxiliar mantido para compatibilidade com okrMetrics.ts ────────

  async getKeyResultName(keyResultId: string): Promise<string> {
    if (this.keyResultsCache.has(keyResultId)) {
      return this.keyResultsCache.get(keyResultId)!.name;
    }
    const page = await this.fetchPage(keyResultId);
    if (!page) return 'Key Result';
    return page.properties?.['Key Result']?.title?.[0]?.plain_text || 'Key Result';
  }
}
