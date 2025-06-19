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

export default api;
