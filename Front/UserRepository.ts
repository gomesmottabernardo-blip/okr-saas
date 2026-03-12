import { User } from './User';
import bcrypt from 'bcryptjs';

// Usuários mockados (MVP)
const users: User[] = [
  {
    id: '1',
    email: 'admin@empresa1.com',
    passwordHash: bcrypt.hashSync('123456', 10),
    companyId: 'empresa1'
  }
];

export function findUserByEmail(email: string): User | undefined {
  return users.find(u => u.email === email);
}

export function findUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}
