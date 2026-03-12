import { Company } from './Company';

const companies: Company[] = [
  {
    id: 'empresa1',
    name: 'Empresa 1',
    dataSource: 'notion',
    config: {
      apiKey: process.env.NOTION_API_KEY,
      databaseId: process.env.NOTION_DATABASE_ID
    }
  }
];

export function getCompanyById(id: string): Company | undefined {
  return companies.find(c => c.id === id);
}
