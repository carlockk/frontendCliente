import { useCart } from "../contexts/cart/CartContext";
import api from "../api";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const { state, dispatch } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [metodoPago, setMetodoPago] = useState("");
  const [tipoPagoEfectivo, setTipoPagoEfectivo] = useState("");
  const [tipoPedido, setTipoPedido] = useState("tienda");

  const [cliente, setCliente] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    correo: "",
    codigoPostal: "",
  });

  const handleInput = (e) => {
    setCliente({ ...cliente, [e.target.name]: e.target.value });
  };

  const validarFormulario = (esPagoOnline = false) => {
    if (!state.items || state.items.length === 0) {
      alert("El carrito está vacío.");
      navigate("/");
      return false;
    }

    if (!cliente.nombre || !cliente.telefono) {
      alert("Nombre y teléfono son obligatorios.");
      return false;
    }

    if (tipoPedido === "delivery" && !cliente.direccion) {
      alert("Debes ingresar una dirección para delivery.");
      return false;
    }

    if (!esPagoOnline) {
      switch (metodoPago) {
        case "":
          alert("Selecciona un método de pago.");
          return false;
        case "efectivo":
          if (!tipoPagoEfectivo) {
            alert("Selecciona dónde pagarás el efectivo.");
            return false;
          }
          break;
        default:
          break;
      }
    }

    return true;
  };

  const crearOrden = async () => {
    if (!validarFormulario()) return;

    setLoading(true);

    try {
      const productos = state.items.map((item) => ({
        nombre: item.nombre,
        cantidad: item.quantity,
        precio_unitario: item.precio ?? item.price ?? 0,
        subtotal: (item.precio ?? item.price ?? 0) * item.quantity,
      }));

      const total = productos.reduce((sum, p) => sum + p.subtotal, 0);

      const res = await api.post("/ventasCliente", {
        productos,
        total,
        tipo_pago: metodoPago === "efectivo" ? tipoPagoEfectivo : metodoPago,
        cliente_email: cliente.correo || user?.email || "sincorreo",
      });

      dispatch({ type: "CLEAR_CART" });
      navigate(`/compras/detalle/${res.data._id}`);
    } catch (err) {
      console.error("Error al guardar venta:", err);
      alert("No se pudo procesar el pedido.");
    } finally {
      setLoading(false);
    }
  };

  const handlePagarConStripe = async () => {
    if (!validarFormulario(true)) return;

    setLoading(true);

    try {
      const response = await api.post("/pagos/crear-sesion", {
        items: state.items.map((item) => ({
          nombre: item.nombre,
          precio: item.precio ?? item.price ?? 0,
          cantidad: item.quantity,
        })),
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error al crear sesión de pago:", error);
      alert("No se pudo iniciar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Finalizar pedido</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* COLUMNA IZQUIERDA: Productos */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Resumen del carrito</h2>
          {state.items.map((item) => (
            <div key={item._id} className="flex gap-4 border-b py-3 items-center">
              {item.imagen_url && (
                <img
                  src={item.imagen_url}
                  alt={item.nombre}
                  className="w-16 h-16 object-cover rounded border border-white shadow-sm"
                />
              )}
              <div className="flex-1">
                <span className="block text-sm font-semibold">
                  {item.nombre} x {item.quantity}
                </span>
                <span className="block text-sm text-gray-600">
                  ${((item.precio ?? item.price ?? 0) * item.quantity).toLocaleString("es-CL")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* COLUMNA DERECHA: Formulario */}
        <div>
          <div className="space-y-4">
            <div>
              <label className="font-medium">Tipo de pedido:</label>
              <select
                value={tipoPedido}
                onChange={(e) => setTipoPedido(e.target.value)}
                className="block w-full border rounded px-3 py-2 mt-1"
              >
                <option value="tienda">Para consumir en tienda</option>
                <option value="retiro">Retiro en tienda</option>
                <option value="delivery">Delivery a domicilio</option>
              </select>
            </div>

            <input type="text" name="nombre" placeholder="Nombre completo" className="w-full border rounded px-3 py-2" onChange={handleInput} />
            <input type="tel" name="telefono" placeholder="Teléfono" className="w-full border rounded px-3 py-2" onChange={handleInput} />
            {tipoPedido === "delivery" && (
              <input type="text" name="direccion" placeholder="Dirección" className="w-full border rounded px-3 py-2" onChange={handleInput} />
            )}
            <input type="email" name="correo" placeholder="Correo electrónico (opcional)" className="w-full border rounded px-3 py-2" onChange={handleInput} />
            <input type="text" name="codigoPostal" placeholder="Código postal (opcional)" className="w-full border rounded px-3 py-2" onChange={handleInput} />

            <div>
              <label className="block font-medium mb-1">Método de pago:</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- Selecciona --</option>
                <option value="online">Tarjeta (Stripe)</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>

            {metodoPago === "efectivo" && (
              <div>
                <label className="block font-medium mb-1">¿Dónde pagarás?</label>
                <select
                  value={tipoPagoEfectivo}
                  onChange={(e) => setTipoPagoEfectivo(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Selecciona --</option>
                  <option value="caja">En caja (local)</option>
                  {tipoPedido === "delivery" && (
                    <option value="domicilio">Al recibir en casa</option>
                  )}
                </select>
              </div>
            )}

            {metodoPago === "online" ? (
              <button
                onClick={handlePagarConStripe}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Redirigiendo a Stripe..." : "Pagar con Stripe 💳"}
              </button>
            ) : (
              <button
                onClick={crearOrden}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Confirmar Pedido"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
