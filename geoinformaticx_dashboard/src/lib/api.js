import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    error.message =
      error.response?.data?.message || "Could not reach the server. Is the backend running?";
    return Promise.reject(error);
  }
);

export default api;