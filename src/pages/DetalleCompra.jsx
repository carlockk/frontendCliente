import { useEffect, useState, useRef } from "react";
import api from \"../api\";
import { useParams } from "react-router-dom";
const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const DetalleCompra = () => {
  const { id } = useParams();
  const [venta, setVenta] = useState(null);
  const ticketRef = useRef();

  useEffect(() => {
    const obtenerDetalle = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const res = await api.get(`${API_URL}/ventasCliente/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setVenta(res.data);
      } catch (err) {
        console.error("Error al cargar detalle:", err);
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

  if (!venta) return <p className="text-center mt-10">Cargando detalle...</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded shadow">
      <div ref={ticketRef}>
        <h2 className="text-2xl font-bold mb-4">🧾 Detalle de Compra #{venta.numero_pedido || venta._id.slice(-5)}</h2>
        <p><strong>Fecha:</strong> {new Date(venta.fecha).toLocaleString()}</p>
        <p><strong>Pago:</strong> {venta.tipo_pago}</p>

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
            {venta.productos.map((prod, i) => (
              <tr key={i} className="border-b">
                <td>{prod.nombre}</td>
                <td>{prod.cantidad}</td>
                <td>${prod.precio_unitario.toLocaleString("es-CL")}</td>
                <td>${prod.subtotal.toLocaleString("es-CL")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-4 text-right text-lg font-semibold">
          Total: ${venta.total.toLocaleString("es-CL")}
        </p>
      </div>

      <div className="mt-6 flex justify-end">
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
