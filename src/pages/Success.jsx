import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../contexts/cart/CartContext";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";

const Success = () => {
  const { dispatch } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [estado, setEstado] = useState("Confirmando pago...");
  const [detalleId, setDetalleId] = useState("");

  useEffect(() => {
    const confirmar = async () => {
      dispatch({ type: "CLEAR_CART" });

      const tokenWs = searchParams.get("token_ws");
      const tbkToken = searchParams.get("TBK_TOKEN");

      if (!tokenWs) {
        if (tbkToken) {
          setEstado("Pago cancelado o rechazado. Puedes intentarlo nuevamente.");
        } else {
          setEstado("No se encontró token de pago para confirmar.");
        }
        return;
      }

      try {
        const res = await api.post("/pagos/confirmar-sesion", { token_ws: tokenWs });
        const venta = res?.data?.venta;
        if (!venta) {
          setEstado("Pago confirmado. Pedido registrado.");
          return;
        }

        let detalleDestinoId = venta._id;

        if (!user?.token) {
          const prev = JSON.parse(localStorage.getItem("ventas_local") || "[]");
          const existente = prev.find((v) => v.backend_id === venta._id);

          if (existente?._id) {
            detalleDestinoId = existente._id;
          } else {
            const ordenLocal = {
              _id: `local_${Date.now().toString(36)}`,
              backend_id: venta._id,
              numero_pedido: venta.numero_pedido,
              fecha: venta.fecha,
              tipo_pago: "tarjeta_webpay",
              estado_pedido: venta.estado_pedido || "pendiente",
              total: venta.total || 0,
              local: venta.local || null,
            };
            localStorage.setItem("ventas_local", JSON.stringify([ordenLocal, ...prev]));
            detalleDestinoId = ordenLocal._id;
          }
        }

        setDetalleId(detalleDestinoId);
        setEstado(`Pago exitoso. Pedido #${venta.numero_pedido} registrado. Serás redirigido en 4 segundos.`);
      } catch (err) {
        setEstado(err?.response?.data?.error || "Hubo un problema al confirmar el pago. Intenta recargar.");
      }
    };

    confirmar();
  }, [dispatch, searchParams, user?.token]);

  useEffect(() => {
    if (!detalleId) return undefined;
    const timer = setTimeout(() => {
      navigate(`/compras/detalle/${detalleId}`);
    }, 4000);
    return () => clearTimeout(timer);
  }, [detalleId, navigate]);

  return (
    <div className="p-6 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold text-green-600 mb-4">Resultado del pago</h1>
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
