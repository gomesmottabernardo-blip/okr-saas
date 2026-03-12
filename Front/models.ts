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
