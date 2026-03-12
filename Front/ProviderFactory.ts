import { IDataProvider } from './IDataProvider';
import { NotionProvider } from './NotionProvider';
import { Company } from '../domain/Company';

export function getDataProvider(company: Company): IDataProvider {
  switch (company.dataSource) {
    case 'notion':
    default:
      return new NotionProvider(company.config);
  }
}
