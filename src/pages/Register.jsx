import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre || !form.email || !form.password) {
      setError("Todos los campos son obligatorios");
      return;
    }

    const { success, message } = await register(form);
    if (success) {
      navigate("/perfil");
    } else {
      setError(message || "Error al registrarse");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Crear Cuenta</h2>
      {error && <p className="text-red-500 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          className="w-full border rounded px-3 py-2"
          onChange={handleChange}
          autoComplete="name"
        />
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          className="w-full border rounded px-3 py-2"
          onChange={handleChange}
          autoComplete="email"
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          className="w-full border rounded px-3 py-2"
          onChange={handleChange}
          autoComplete="new-password"
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Registrarse
        </button>
      </form>

      <p className="text-sm mt-4">
        ¿Ya tienes cuenta?{" "}
        <a href="/login" className="text-blue-600">
          Inicia sesión aquí
        </a>
      </p>
    </div>
  );
};

export default Register;
