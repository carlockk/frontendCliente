import { useEffect, useState, useRef } from "react";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";
import { useLocal } from "../contexts/LocalContext";
import { formatOrderAddon, normalizeOrderAddons } from "../utils/orderAddons";

const DetalleCompra = () => {
  const { id } = useParams();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const ticketRef = useRef();
  const { locales } = useLocal();
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerDetalle = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        if (token) {
          const res = await api.get(`/ventasCliente/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setVenta(res.data);
          return;
        }

        const locales = JSON.parse(localStorage.getItem("ventas_local") || "[]");
        const encontrada = locales.find((v) => v._id === id) || null;
        setVenta(encontrada);
      } catch (err) {
        console.error("Error al cargar detalle:", err);
      } finally {
        setLoading(false);
      }
    };

    obtenerDetalle();
  }, [id]);

  const imprimir = () => {
    const printContent = ticketRef.current.innerHTML;
    const win = window.open("", "Imprimir", "width=600,height=600");
    win.document.write(`
      <html>
        <head>
          <title>Ticket</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            h2 { color: #333; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (loading) return <p className="text-center mt-10">Cargando detalle...</p>;
  if (!venta) return <p className="text-center mt-10">Compra no encontrada.</p>;
  const localNombre =
    venta.local_nombre ||
    locales.find((l) => l._id === venta.local)?.nombre ||
    "";
  const estadoRaw = venta.estado_pedido || venta.estado || venta.status || "pendiente";
  const estado = String(estadoRaw).toLowerCase();

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded shadow">
      <button
        onClick={() => navigate("/compras")}
        className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
      >
        <span aria-hidden="true">←</span>
        <span>Volver</span>
      </button>

      <div ref={ticketRef}>
        <h2 className="text-2xl font-bold mb-4">
          🧾 Detalle de Compra #{venta.numero_pedido || venta._id.slice(-5)}
        </h2>
        <p><strong>Fecha:</strong> {new Date(venta.fecha).toLocaleString()}</p>
        {localNombre && <p><strong>Local:</strong> {localNombre}</p>}
        <p><strong>Pago:</strong> {venta.tipo_pago}</p>
        <p>
          <strong>Estado:</strong>{" "}
          <span
            className={`text-xs px-2 py-1 rounded ${
              estado === "aceptado" || estado === "preparando" || estado === "listo"
                ? "bg-blue-100 text-blue-700"
                : estado === "entregado"
                ? "bg-green-100 text-green-700"
                : estado === "rechazado" || estado === "cancelado"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {estadoRaw}
          </span>
        </p>

        <table className="w-full mt-4 border-t">
          <thead>
            <tr className="text-left border-b">
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {venta.productos.map((prod, i) => {
              const agregados = normalizeOrderAddons(prod.agregados);
              return (
              <tr key={i} className="border-b">
                <td>
                  {prod.nombre}
                  {(prod.varianteNombre || prod.variante_nombre) && (
                    <p className="text-xs text-gray-500">
                      Variación: {prod.varianteNombre || prod.variante_nombre}
                    </p>
                  )}
                  {agregados.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Agregados: {agregados.map((agg) => formatOrderAddon(agg)).join(", ")}
                    </p>
                  )}
                </td>
                <td>{prod.cantidad}</td>
                <td>${prod.precio_unitario.toLocaleString("es-CL")}</td>
                <td>${prod.subtotal.toLocaleString("es-CL")}</td>
              </tr>
              );
            })}
          </tbody>
        </table>

        <p className="mt-4 text-right text-lg font-semibold">
          Total: ${venta.total.toLocaleString("es-CL")}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/compras")}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
        >
          Volver a mis compras
        </button>
        <button
          onClick={imprimir}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🖨️ Imprimir
        </button>
      </div>
    </div>
  );
};

export default DetalleCompra;
