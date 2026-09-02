// ==========================================
// API & HTTP Types & Interfaces
// ==========================================

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error' | 'healthy';
  message?: string;
  version?: string;
  data?: T;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  stack?: string;
}

// ==========================================
// Socket.IO Types & Interfaces
// ==========================================

export interface PingPayload {
  clientTime?: string;
  [key: string]: unknown;
}

export interface PongPayload extends PingPayload {
  timestamp: string;
}

export interface ServerToClientEvents {
  pong: (data: PongPayload) => void;
  [event: string]: (...args: any[]) => void;
}

export interface ClientToServerEvents {
  ping: (data: PingPayload) => void;
  [event: string]: (...args: any[]) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  sessionId?: string;
}

// ==========================================
// Database Types & Interfaces
// ==========================================

export interface DbConnectionOptions {
  serverSelectionTimeoutMS?: number;
  autoIndex?: boolean;
}

// ==========================================
// Authentication & JWT Types & Interfaces
// ==========================================

export interface JwtUserPayload {
  userId: string;
  email: string;
  name?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  user: {
    userId: string;
    email: string;
    name?: string;
    role?: string;
  };
}

