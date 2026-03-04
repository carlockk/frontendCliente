import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const mergeFavoritosGuest = (userId) => {
    if (!userId) return;
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("favoritos_guest_"));
    keys.forEach((guestKey) => {
      const localSuffix = guestKey.replace("favoritos_guest_", "") || "sinlocal";
      const guestRaw = localStorage.getItem(guestKey);
      if (!guestRaw) return;

      let guest = [];
      try {
        guest = JSON.parse(guestRaw) || [];
      } catch {
        guest = [];
      }

      const userKey = `favoritos_${userId}_${localSuffix}`;
      const userRaw = localStorage.getItem(userKey);
      let userFav = [];
      try {
        userFav = userRaw ? JSON.parse(userRaw) : [];
      } catch {
        userFav = [];
      }

      const merged = Array.from(new Set([...(userFav || []), ...(guest || [])]));
      localStorage.setItem(userKey, JSON.stringify(merged));
      localStorage.removeItem(guestKey);
    });
  };

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) {
      setUser(savedUser);
      api.defaults.headers.common["Authorization"] = `Bearer ${savedUser.token}`;
      mergeFavoritosGuest(savedUser._id);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post("/clientes/login", {
        email,
        password,
      });

      const { cliente, token } = res.data;
      const userData = { ...cliente, token };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      mergeFavoritosGuest(userData._id);

      return { success: true };
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      return { success: false, message: "Correo o contraseña incorrectos" };
    }
  };

  const register = async (nuevoUsuario) => {
    try {
      const res = await api.post("/clientes/register", nuevoUsuario);
      const { cliente, token } = res.data;

      const userData = { ...cliente, token };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      mergeFavoritosGuest(userData._id);

      alert("Registro exitoso");
      return { success: true };
    } catch (err) {
      console.error("Registro error:", err.response?.data || err.message);
      return { success: false, message: "Error al registrarse" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, isLogged: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
