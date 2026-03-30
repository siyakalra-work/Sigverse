import api from './api';
import { getApiUrl } from '../utils/config';

export const loginWithGithub = () => {
  window.location.href = `${getApiUrl()}/auth/github`;
};

export const loginWithEmail = (data) => api.post('/auth/login', data);
export const signupWithEmail = (data) => api.post('/auth/signup', data);
export const verifyLoginOtp = (data) => api.post('/auth/login/verify', data);
export const verifySignupOtp = (data) => api.post('/auth/signup/verify', data);
export const requestPasswordReset = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);
export const getDemoUsers = () => api.get('/auth/demo-users');
export const getMe = () => api.get('/auth/me');

export const logout = () => api.post('/auth/logout');
