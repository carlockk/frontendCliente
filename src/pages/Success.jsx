import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../contexts/cart/CartContext";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";

const Success = () => {
  const { dispatch } = useCart();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [estado, setEstado] = useState("Confirmando pago...");
  const [detalleId, setDetalleId] = useState("");

  useEffect(() => {
    const confirmar = async () => {
      dispatch({ type: "CLEAR_CART" });
      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        setEstado("Pago exitoso. Estamos validando tu pedido.");
        return;
      }

      try {
        const res = await api.post("/pagos/confirmar-sesion", { session_id: sessionId });
        const venta = res?.data?.venta;
        if (!venta) {
          setEstado("Pago exitoso. Pedido confirmado.");
          return;
        }

        if (!user?.token) {
          const prev = JSON.parse(localStorage.getItem("ventas_local") || "[]");
          const existe = prev.some((v) => v.backend_id === venta._id);
          if (!existe) {
            const ordenLocal = {
              _id: `local_${Date.now().toString(36)}`,
              backend_id: venta._id,
              numero_pedido: venta.numero_pedido,
              fecha: venta.fecha,
              tipo_pago: "tarjeta_online",
              estado_pedido: venta.estado_pedido || "pendiente",
              total: venta.total || 0,
              local: venta.local || null,
            };
            localStorage.setItem("ventas_local", JSON.stringify([ordenLocal, ...prev]));
          }
        }

        setDetalleId(venta._id);
        setEstado(`Pago exitoso. Pedido #${venta.numero_pedido} registrado.`);
      } catch {
        setEstado("Pago exitoso. Hubo un retraso al confirmar el pedido, recarga en unos segundos.");
      }
    };

    confirmar();
  }, [dispatch, searchParams, user?.token]);

  return (
    <div className="p-6 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold text-green-600 mb-4">✅ ¡Pago exitoso!</h1>
      <p className="mb-4">{estado}</p>
      {detalleId ? (
        <Link to={`/compras/detalle/${detalleId}`} className="text-blue-600 underline mr-4">
          Ver mi pedido
        </Link>
      ) : null}
      <Link to="/" className="text-blue-600 underline">Volver al inicio</Link>
    </div>
  );
};

export default Success;

