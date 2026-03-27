import api from './api';

export const loginWithGithub = () => {
  window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/github`;
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
