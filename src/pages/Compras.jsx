import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useLocal } from "../contexts/LocalContext";

const Compras = () => {
  const { user } = useAuth();
  const [ventas, setVentas] = useState([]);
  const navigate = useNavigate();
  const { locales } = useLocal();
  const [filtroLocal, setFiltroLocal] = useState(
    () => localStorage.getItem("compras_filtro_local") || "todos"
  );

  useEffect(() => {
    const cargarVentas = async () => {
      if (!user || !user.token) {
        const locales = JSON.parse(localStorage.getItem("ventas_local") || "[]");
        setVentas(locales);
        return;
      }

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

  const ventasPorLocal = useMemo(() => {
    const mapNombre = (venta) => {
      if (venta.local_nombre) return venta.local_nombre;
      const local = locales.find((l) => l._id === venta.local);
      return local?.nombre || "Sin local";
    };

    const grupos = {};
    ventas.forEach((venta) => {
      const nombre = mapNombre(venta);
      if (!grupos[nombre]) grupos[nombre] = [];
      grupos[nombre].push(venta);
    });
    return grupos;
  }, [ventas, locales]);

  const localesDisponibles = useMemo(
    () => Object.keys(ventasPorLocal),
    [ventasPorLocal]
  );

  const ventasFiltradas = useMemo(() => {
    if (filtroLocal === "todos") return ventasPorLocal;
    if (!ventasPorLocal[filtroLocal]) return {};
    return { [filtroLocal]: ventasPorLocal[filtroLocal] };
  }, [ventasPorLocal, filtroLocal]);
  
  useEffect(() => {
    localStorage.setItem("compras_filtro_local", filtroLocal);
  }, [filtroLocal]);

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">🧾 Historial de Compras</h2>

      {ventas.length === 0 ? (
        <p>No tienes compras registradas aún.</p>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filtrar por local:</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filtroLocal}
              onChange={(e) => setFiltroLocal(e.target.value)}
            >
              <option value="todos">Todos</option>
              {localesDisponibles.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>

          {Object.entries(ventasFiltradas).map(([localNombre, lista]) => (
            <div key={localNombre}>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {localNombre} ({lista.length})
              </h3>
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
                  {lista.map((venta) => (
                    <tr key={venta._id} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        {venta.numero_pedido || venta._id.slice(-5)}
                      </td>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Compras;
