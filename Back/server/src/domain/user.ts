export interface User {
  id: string;
  email: string;
  password: string;
  companyId: string;
}

export const users: User[] = [
  {
    id: '1',
    email: 'admin@empresa1.com',
    password: '123456',
    companyId: 'c1', // ⚠️ agora bate com company.id
  },
];