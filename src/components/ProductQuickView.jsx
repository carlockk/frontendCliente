import { useEffect, useState } from "react";
import { useCart } from "../contexts/cart/CartContext";

export default function ProductQuickView({ isOpen, toggle, producto }) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [toastVisible, setToastVisible] = useState(false);
  const { dispatch } = useCart();

  useEffect(() => {
    if (isOpen) {
      setCantidad(1);
      setToastVisible(false);
      setShowAnimation(false);
      const timeout = setTimeout(() => setShowAnimation(true), 10);
      return () => clearTimeout(timeout);
    } else {
      setShowAnimation(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const escHandler = (e) => e.key === "Escape" && toggle();
    window.addEventListener("keydown", escHandler);
    return () => window.removeEventListener("keydown", escHandler);
  }, [toggle]);

  if (!isOpen || !producto) return null;

  const aumentar = () => setCantidad((c) => c + 1);
  const disminuir = () => setCantidad((c) => (c > 1 ? c - 1 : 1));

  const agregarAlCarrito = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: { ...producto, cantidad },
    });
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
      toggle(); // cerrar vista
    }, 2500);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center transition-opacity duration-300 ${
        showAnimation ? "bg-black bg-opacity-40" : "bg-black bg-opacity-0"
      }`}
      onClick={toggle}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white w-full sm:max-w-md h-[90%] sm:h-auto sm:fixed sm:right-0 shadow-xl rounded-t-lg sm:rounded-lg overflow-y-auto transform transition-transform duration-300 ${
          showAnimation
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }`}
      >
        <div className="relative p-5 pt-12">
          <button
            onClick={toggle}
            className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl z-10"
            aria-label="Cerrar vista rápida"
          >
            ✖
          </button>

          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-40 object-cover rounded mb-4"
          />
          <h2 className="text-lg font-bold mb-1">{producto.nombre}</h2>
          <p className="text-sm text-gray-700 mb-3">{producto.descripcion}</p>
          <p className="text-green-600 font-semibold text-base mb-4">
            ${producto.precio?.toLocaleString("es-CL")}
          </p>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={disminuir}
              className="bg-gray-200 px-3 py-1 rounded text-lg font-bold"
            >
              -
            </button>
            <span className="text-lg">{cantidad}</span>
            <button
              onClick={aumentar}
              className="bg-gray-200 px-3 py-1 rounded text-lg font-bold"
            >
              +
            </button>
          </div>

          <button
            onClick={agregarAlCarrito}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold"
          >
            Agregar al carrito
          </button>

          <h3 className="text-sm font-semibold mb-2 mt-6">Productos relacionados:</h3>
          <div className="grid grid-cols-3 gap-2">
            {producto.relacionados?.map((rel) => (
              <div key={rel._id} className="text-center">
                <img
                  src={rel.imagen_url}
                  alt={rel.nombre}
                  className="h-16 w-16 object-cover mx-auto rounded"
                />
                <p className="text-xs mt-1">{rel.nombre}</p>
                <p className="text-xs text-green-600">
                  ${rel.precio?.toLocaleString("es-CL")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Mensaje flotante de éxito */}
      {toastVisible && (
        <div className="fixed bottom-8 sm:bottom-12 bg-green-600 text-white px-4 py-2 rounded shadow-lg text-sm animate-fadeIn z-[99999]">
          ✅ Producto agregado al carrito
        </div>
      )}
    </div>
  );
}
