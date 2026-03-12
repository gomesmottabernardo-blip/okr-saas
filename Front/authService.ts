import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '../domain/UserRepository';
import { User } from '../domain/User';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

export function login(email: string, password: string) {
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const passwordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordValid) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    {
      userId: user.id,
      companyId: user.companyId
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      companyId: user.companyId
    }
  };
}
