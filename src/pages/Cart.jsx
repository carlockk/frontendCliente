import { useCart } from "../contexts/cart/CartContext";
import { Link } from "react-router-dom";

const Cart = () => {
  const { state, dispatch } = useCart();

  const getCartItemId = (item) =>
    item.idCarrito || `${item._id}::${item.varianteId || item.varianteKey || "base"}`;

  const handleRemove = (id) => {
    dispatch({ type: "REMOVE_ITEM", payload: id });
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Carrito de Compras</h1>

      {state.items.length === 0 ? (
        <p className="text-gray-600">Tu carrito está vacío.</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-200">
            {state.items.map((item) => (
              <li key={getCartItemId(item)} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold">{item.nombre}</p>
                  {item.varianteNombre && (
                    <p className="text-xs text-gray-500">Variación: {item.varianteNombre}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    ${item.precio?.toLocaleString("es-CL")} x {item.quantity}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(getCartItemId(item))}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 text-right">
            <p className="text-lg font-bold mb-2">
              Total: ${state.total.toLocaleString("es-CL")}
            </p>
            <Link
              to="/checkout"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Finalizar Compra
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
