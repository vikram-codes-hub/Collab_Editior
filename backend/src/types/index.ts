export interface JwtPayload {
  userId: string;
  email: string;
}

export interface Room {
  id: string;
  name: string;
  language: string;
  createdBy: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}
