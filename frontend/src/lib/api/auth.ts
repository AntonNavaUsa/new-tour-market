import api from '../axios';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  User,
} from '../../types';

export const authApi = {
  // Регистрация
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  // Логин
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  // Обновление токена
  refreshToken: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/refresh', data);
    return response.data;
  },

  // Получить текущего пользователя
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/profile');
    return response.data;
  },

  // Логаут (локальный)
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};
