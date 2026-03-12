export type DataSourceType = 'notion' | 'trello' | 'google_sheets';

export interface Company {
  id: string;
  name: string;
  dataSource: DataSourceType;
  config: {
    apiKey?: string;
    databaseId?: string;
    boardId?: string;
    spreadsheetId?: string;
  };
}
