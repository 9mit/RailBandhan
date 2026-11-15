import type { SessionUser } from "./session";
import {
  buildLogoutCookie,
  buildSessionCookie,
  createUser,
  getSessionUser,
  login,
} from "./session";

export interface AuthProvider {
  signUp(email: string, password: string): Promise<SessionUser>;
  signIn(email: string, password: string): Promise<SessionUser>;
  getUserFromRequest(req: Request): Promise<SessionUser | null>;
  createSessionCookie(userId: string): Promise<string>;
  createLogoutCookie(): string;
}

export class LocalSessionAuthProvider implements AuthProvider {
  async signUp(email: string, password: string): Promise<SessionUser> {
    const user = await createUser(email, password);
    return { id: user.id, email: user.email };
  }

  async signIn(email: string, password: string): Promise<SessionUser> {
    const user = await login(email, password);
    return { id: user.id, email: user.email };
  }

  async getUserFromRequest(req: Request): Promise<SessionUser | null> {
    return getSessionUser(req);
  }

  createSessionCookie(userId: string): Promise<string> {
    return buildSessionCookie(userId);
  }

  createLogoutCookie(): string {
    return buildLogoutCookie();
  }
}

let authProviderInstance: AuthProvider | null = null;

export function getAuthProvider(): AuthProvider {
  if (!authProviderInstance) {
    authProviderInstance = new LocalSessionAuthProvider();
  }
  return authProviderInstance;
}
