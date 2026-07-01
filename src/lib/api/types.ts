/**
 * API Types
 * User and session types for the PHP backend (replaces Supabase User/Session)
 */

export interface IUser {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}

export interface ISession {
  token: string;
  user: IUser;
}
