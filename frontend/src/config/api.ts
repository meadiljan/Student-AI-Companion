/**
 * API Configuration for different environments
 */

// Get the API base URL from environment variables or use default
const getApiBaseUrl = (): string => {
  // In development, use proxy (relative path)
  if (import.meta.env.DEV) {
    return '/api'; // Use Vite proxy
  }
  
  // In production, use environment variable or current domain
  return import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  TASKS: '/tasks',
  COURSES: '/courses',
  NOTES: '/notes',
  EVENTS: '/events',
  CHAT: '/chat',
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Export default configuration
export default {
  baseURL: API_BASE_URL,
  endpoints: API_ENDPOINTS,
  buildUrl: buildApiUrl,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};