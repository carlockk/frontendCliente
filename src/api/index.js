import axios from "axios";

// ✅ Forzar que Vite incluya la variable en el build
const URL = import.meta.env.VITE_API_URL;
if (!URL) console.warn("⚠️ VITE_API_URL no está definida");
console.log("🔧 API baseURL usada:", URL);

const api = axios.create({
  baseURL: URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const envLocalId = import.meta.env.VITE_LOCAL_ID;
  const storedLocalId = localStorage.getItem("local_id");
  const localId = String(storedLocalId || envLocalId || "").trim();

  if (localId) {
    config.headers["x-local-id"] = localId;
  }

  return config;
});

export default api;
