import { createContext, useContext, useState, useEffect } from "react";
import api from \"../api\";
const AuthContext = createContext();

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) {
      setUser(savedUser);
      axios.defaults.headers.common["Authorization"] = `Bearer ${savedUser.token}`;
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post(`${API_URL}/clientes/login`, {
        email,
        password,
      });

      const { cliente, token } = res.data;
      const userData = { ...cliente, token };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { success: true };
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      return { success: false, message: "Correo o contraseña incorrectos" };
    }
  };

  const register = async (nuevoUsuario) => {
    try {
      const res = await api.post(`${API_URL}/clientes/register`, nuevoUsuario);
      const { cliente, token } = res.data;

      const userData = { ...cliente, token };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

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
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, isLogged: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
