// src/components/ProductQuickView.jsx
import { useEffect } from "react";

export default function ProductQuickView({ producto, onClose }) {
  // Cerrar con tecla Esc
  useEffect(() => {
    const escHandler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", escHandler);
    return () => window.removeEventListener("keydown", escHandler);
  }, [onClose]);

  if (!producto) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-md h-[90%] sm:h-auto transform transition-all duration-300 translate-y-0 sm:translate-x-0 sm:translate-y-0 sm:fixed sm:right-0"
      >
        <div className="relative p-5 overflow-y-auto h-full sm:h-auto">
          {/* Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
            aria-label="Cerrar vista rápida"
          >
            ✖
          </button>

          {/* Contenido */}
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

          {/* Relacionados */}
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
                <p className="text-xs text-green-600">${rel.precio?.toLocaleString("es-CL")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
