import axios from "axios";

// VITE_API_BASE_URL should point to the API server origin (default: local API on port 4000).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
});
