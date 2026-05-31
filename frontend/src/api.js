import axios from 'axios';
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const PUBLIC_API_URL = import.meta.env.VITE_API_URL ? 
    import.meta.env.VITE_API_URL.replace('/api', '') : 
    'http://localhost:5000';

const API = axios.create({ baseURL: API_BASE_URL });

API.interceptors.request.use((req) => {
    const token = sessionStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;
