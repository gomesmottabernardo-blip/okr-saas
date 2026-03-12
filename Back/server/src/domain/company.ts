export interface Company {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export const companies: Company[] = [
  {
    id: 'c1',
    name: 'Empresa 1',
    slug: 'empresa1',
    createdAt: new Date(),
  },
  {
    id: 'c2',
    name: 'Empresa 2',
    slug: 'empresa2',
    createdAt: new Date(),
  },
];