import { Request } from 'express';

// 使用者認證介面
export interface User {
  userId: string;
  userCode: string;
  email: string;
}

// 擴展的請求介面，包含認證使用者資訊
export interface AuthenticatedRequest extends Request {
  user?: User | null;
}

// JWT Payload 介面
export interface JWTPayload {
  userId: string;
  userCode: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Google ID Token 解碼後的結構
export interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash?: string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  iat: number;
  exp: number;
}

// 登入請求參數
export interface LoginRequest {
  idToken: string;
}

// 登入回應資料
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    userId: string;
    email: string;
    displayName: string;
    avatarUrl: string;
    isNewUser: boolean;
  };
}

// 使用者設定介面
export interface UserSettings {
  language: 'zh-TW' | 'en';
  theme: 'light' | 'dark';
  timezone: string;
}

// 使用者資料庫記錄介面
export interface UserRecord {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  google_id: string;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// 權限類型
export type Permission = 
  | 'read_own_data'
  | 'write_own_data'
  | 'manage_styles'
  | 'view_analytics'
  | 'admin_access';

// 使用者角色
export type UserRole = 'user' | 'admin' | 'moderator';

// API 回應格式
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
}

// 分頁查詢參數
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分頁回應格式
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}