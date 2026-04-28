// Centralized configuration for the frontend
// In development, it uses localhost:5000
// In production, it uses the VITE_API_URL environment variable

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const PUBLIC_API_URL = import.meta.env.VITE_API_URL ? 
    import.meta.env.VITE_API_URL.replace('/api', '') : 
    'http://localhost:5000';
