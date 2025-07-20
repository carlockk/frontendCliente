import { useCart } from "../contexts/cart/CartContext";
import api from "../api";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const { state, dispatch } = useCart();
  const { user, isLogged } = useAuth();
  const navigate = useNavigate();

  const [numeroPedido, setNumeroPedido] = useState(null);
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

  const crearOrden = async () => {
    if (!state.items || state.items.length === 0) {
      alert("El carrito está vacío.");
      return navigate("/");
    }

    if (!cliente.nombre || !cliente.telefono) {
      alert("Nombre y teléfono son obligatorios.");
      return;
    }

    if (tipoPedido === "delivery" && !cliente.direccion) {
      alert("Debes ingresar una dirección para delivery.");
      return;
    }

    if (!metodoPago) {
      alert("Selecciona un método de pago.");
      return;
    }

    if (metodoPago === "efectivo" && !tipoPagoEfectivo) {
      alert("Selecciona dónde pagarás el efectivo.");
      return;
    }

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
    if (!state.items || state.items.length === 0) {
      alert("El carrito está vacío.");
      return navigate("/");
    }

    if (!cliente.nombre || !cliente.telefono) {
      alert("Nombre y teléfono son obligatorios.");
      return;
    }

    if (tipoPedido === "delivery" && !cliente.direccion) {
      alert("Debes ingresar una dirección para delivery.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/pagos/crear-sesion", {
        items: state.items.map(item => ({
          nombre: item.nombre,
          precio: item.precio ?? item.price ?? 0,
          cantidad: item.quantity
        }))
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
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Finalizar pedido</h1>

      {state.items.map((item) => (
        <div key={item._id} className="flex justify-between border-b py-2">
          <span>
            {item.nombre} x {item.quantity}
          </span>
          <span>
            ${((item.precio ?? item.price ?? 0) * item.quantity).toLocaleString("es-CL")}
          </span>
        </div>
      ))}

      <div className="mt-4">
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

      <div className="mt-6 space-y-3">
        <input type="text" name="nombre" placeholder="Nombre completo" className="w-full border rounded px-3 py-2" onChange={handleInput} />
        <input type="tel" name="telefono" placeholder="Teléfono" className="w-full border rounded px-3 py-2" onChange={handleInput} />
        {tipoPedido === "delivery" && (
          <input type="text" name="direccion" placeholder="Dirección" className="w-full border rounded px-3 py-2" onChange={handleInput} />
        )}
        <input type="email" name="correo" placeholder="Correo electrónico (opcional)" className="w-full border rounded px-3 py-2" onChange={handleInput} />
        <input type="text" name="codigoPostal" placeholder="Código postal (opcional)" className="w-full border rounded px-3 py-2" onChange={handleInput} />
      </div>

      <div className="mt-6">
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
        <div className="mt-4">
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
          className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Redirigiendo a Stripe..." : "Pagar con Stripe 💳"}
        </button>
      ) : (
        <button
          onClick={crearOrden}
          disabled={loading}
          className="mt-6 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Procesando..." : "Confirmar Pedido"}
        </button>
      )}
    </div>
  );
};

export default Checkout;
