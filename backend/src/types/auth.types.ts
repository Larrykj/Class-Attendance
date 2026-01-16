export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  token: string;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}