import axios from 'axios';

// Set your backend's base URL
const BASE_URL = 'http://localhost:5000'; // Or whatever your port is

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