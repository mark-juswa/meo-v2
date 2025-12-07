import axios from 'axios';

// Set your backend's base URL
const BASE_URL = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '';


// This is the public axios instance
export default axios.create({
    baseURL: BASE_URL,
});

// This is the private axios instance with credentials
export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});