import axios from "axios";
import { store } from "../redux/store";
import { logout } from "../redux/authSlice";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Inject Authorization JWT token if available
api.interceptors.request.use(
  async (config) => {
    const state = store.getState();
    const token = state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response error interceptor for auto logout on token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Auto logout and lock vault
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;
