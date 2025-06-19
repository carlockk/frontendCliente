import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const Perfil = () => {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ nombre: "", email: "", direccion: "", telefono: "" });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
        const res = await axios.get(`${API_URL}/clientes/perfil`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setForm(res.data);
      } catch (err) {
        console.error("Error al obtener perfil:", err);
        setError("No se pudo cargar el perfil.");
      }
    };

    fetchPerfil();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = async () => {
    try {
      const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;
      await axios.put(`${API_URL}/clientes/perfil`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMensaje("Perfil actualizado correctamente.");
      setModoEdicion(false);
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      setError("Error al actualizar el perfil.");
    }
  };

  if (!form.nombre) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
        {error ? <p className="text-red-500">{error}</p> : <p>Cargando perfil...</p>}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Mi Perfil</h2>

      {mensaje && <p className="text-green-600 mb-2">{mensaje}</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="space-y-3">
        <input
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          disabled={!modoEdicion}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="email"
          name="email"
          value={form.email}
          disabled
          className="w-full border px-3 py-2 rounded bg-gray-100"
        />
        <input
          type="text"
          name="direccion"
          placeholder="Dirección"
          value={form.direccion || ""}
          onChange={handleChange}
          disabled={!modoEdicion}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="telefono"
          placeholder="Teléfono"
          value={form.telefono || ""}
          onChange={handleChange}
          disabled={!modoEdicion}
          className="w-full border px-3 py-2 rounded"
        />

        {modoEdicion ? (
          <button
            onClick={handleGuardar}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Guardar cambios
          </button>
        ) : (
          <button
            onClick={() => setModoEdicion(true)}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Editar perfil
          </button>
        )}

        <button
          onClick={logout}
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Perfil;
