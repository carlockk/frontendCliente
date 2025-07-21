import { useCart } from "../contexts/cart/CartContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SlideCart({ isOpen, toggle }) {
  const { state, dispatch } = useCart();
  const { isLogged } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  const vaciarCarrito = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const handleCheckout = () => {
    if (!isLogged) {
      alert("Debes iniciar sesión para continuar con el pago.");
      navigate("/");
      toggle(); // cerrar el slide del carrito
      return;
    }
    navigate("/checkout");
    toggle(); // cerrar el slide si está abierto
  };

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      setVisible(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (shouldRender) {
      setTimeout(() => setVisible(true), 10);
    }
  }, [shouldRender]);

  return (
    <>
      {shouldRender && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          <div
            className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300"
            onClick={toggle}
          ></div>

          <div
            className={`relative h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
              visible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="p-4 flex justify-between items-center border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                🛒 Tu Carrito
              </h2>
              <button onClick={toggle} className="text-xl">✕</button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70%]">
              {state.items.length === 0 ? (
                <p className="text-gray-500">El carrito está vacío.</p>
              ) : (
                state.items.map((item) => (
                  <div
                    key={item._id}
                    className="mb-4 flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{item.nombre}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <button
                          onClick={() =>
                            dispatch({ type: "DECREMENT_ITEM", payload: item._id })
                          }
                          className="text-gray-500 text-xl px-2 hover:text-gray-700"
                        >
                          −
                        </button>
                        <span className="text-base font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            dispatch({ type: "INCREMENT_ITEM", payload: item._id })
                          }
                          className="text-gray-500 text-xl px-2 hover:text-gray-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        ${(item.precio * item.quantity).toLocaleString()}
                      </p>
                      <button
                        className="text-red-500 text-sm hover:underline mt-1"
                        onClick={() =>
                          dispatch({ type: "REMOVE_ITEM", payload: item._id })
                        }
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t">
              <p className="text-lg font-semibold mb-2">
                Total: ${state.total.toLocaleString()}
              </p>

              <button
                onClick={handleCheckout}
                className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-semibold"
              >
                💳 Ir al Pago
              </button>

              <button
                onClick={vaciarCarrito}
                className="mt-3 w-full text-red-500 text-sm font-semibold hover:underline flex items-center justify-center gap-2"
              >
                🗑️ Vaciar Carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {state.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[9998] bg-white border-t border-gray-200 shadow-md sm:hidden">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="relative flex items-center">
              <i className="fas fa-shopping-basket text-2xl text-gray-800"></i>
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {state.items.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            </div>

            <div className="text-sm text-gray-800 font-semibold text-center flex-1 mx-4 whitespace-nowrap">
              Total: ${state.total.toLocaleString("es-CL")}
            </div>

            <button
              onClick={toggle}
              className="bg-gray-800 text-white px-5 py-2 rounded-md text-sm font-semibold tracking-wide hover:bg-gray-700"
            >
              PAGO
            </button>
          </div>
        </div>
      )}
    </>
  );
}
