import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Compras = () => {
  const { user } = useAuth();
  const [ventas, setVentas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarVentas = async () => {
      if (!user || !user.token) return;

      try {
        const res = await api.get("/ventasCliente", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setVentas(res.data);
      } catch (err) {
        console.error("Error al cargar historial:", err);
      }
    };

    cargarVentas();
  }, [user]);

  if (!user) return <p className="text-center mt-10">Inicia sesión para ver tus compras.</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">🧾 Historial de Compras</h2>

      {ventas.length === 0 ? (
        <p>No tienes compras registradas aún.</p>
      ) : (
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Pedido #</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Pago</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr key={venta._id} className="border-b hover:bg-gray-50">
                <td className="py-2">{venta.numero_pedido || venta._id.slice(-5)}</td>
                <td>{new Date(venta.fecha).toLocaleString()}</td>
                <td>${venta.total?.toLocaleString("es-CL")}</td>
                <td>{venta.tipo_pago}</td>
                <td>
                  <button
                    onClick={() => navigate(`/compras/detalle/${venta._id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Compras;
