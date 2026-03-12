import { Company } from '../domain/Company';
import { Action, KeyResult, Objective } from '../domain/models';

export interface IDataProvider {
  getActions(company: Company): Promise<Action[]>;
  getKeyResults(company: Company): Promise<KeyResult[]>;
  getObjectives(company: Company): Promise<Objective[]>;
}
