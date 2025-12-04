export interface AuthPayload {
  userId: string;
  email: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
