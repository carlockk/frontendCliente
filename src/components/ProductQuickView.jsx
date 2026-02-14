import { useEffect, useState } from "react";
import { useCart } from "../contexts/cart/CartContext";

export default function ProductQuickView({ isOpen, toggle, producto, onRemoveFavorite }) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const { dispatch } = useCart();

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(false);
      setCantidad(1); // Reiniciar cantidad cada vez que abre
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

  const agregarAlCarrito = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        ...producto,
        cantidad: cantidad,
      },
    });
    toggle(); // cerrar al agregar
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
          {onRemoveFavorite && (
            <button
              onClick={() => onRemoveFavorite(producto._id)}
              className="mb-4 text-sm text-red-600 hover:text-red-700 hover:underline"
            >
              Quitar de favoritos
            </button>
          )}

          {/* Cantidad + botón agregar */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center border rounded px-3 py-1">
              <button
                onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
                className="text-xl text-gray-600 hover:text-black px-2"
              >
                −
              </button>
              <span className="px-2 text-base">{cantidad}</span>
              <button
                onClick={() => setCantidad((prev) => prev + 1)}
                className="text-xl text-gray-600 hover:text-black px-2"
              >
                +
              </button>
            </div>
            <button
              onClick={agregarAlCarrito}
              className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
            >
              Agregar al carrito
            </button>
          </div>

          <h3 className="text-sm font-semibold mb-2">Productos relacionados:</h3>
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
    </div>
  );
}
