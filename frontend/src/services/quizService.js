import api from './api';

export const getCourseQuizzes = (courseId) => api.get(`/quizzes/course/${courseId}`);
export const upsertModuleQuiz = (moduleId, data) => api.post(`/quizzes/modules/${moduleId}`, data);
export const deleteModuleQuiz = (moduleId) => api.delete(`/quizzes/modules/${moduleId}`);

export const submitModuleQuiz = (moduleId, data) => api.post(`/quizzes/modules/${moduleId}/submissions`, data);
export const getQuizSubmissions = (courseId) => api.get(`/quizzes/course/${courseId}/submissions`);
