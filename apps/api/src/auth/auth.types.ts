export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
