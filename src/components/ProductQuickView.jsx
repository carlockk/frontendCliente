// src/components/ProductQuickView.jsx
import { useEffect, useState } from "react";
import clsx from "clsx";


export default function ProductQuickView({ producto, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // activa la animación al montar
    const escHandler = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", escHandler);
    return () => window.removeEventListener("keydown", escHandler);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // espera que termine la animación
  };

  if (!producto) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-end sm:items-center justify-center transition-opacity duration-300"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "bg-white w-full sm:max-w-md h-[90%] sm:h-auto sm:fixed sm:right-0 shadow-xl rounded-t-lg sm:rounded-lg overflow-y-auto transform transition-transform duration-300",
          {
            "translate-y-0 sm:translate-x-0 opacity-100": visible,
            "translate-y-full sm:translate-x-full opacity-0": !visible,
          }
        )}
      >
        <div className="relative p-5">
          {/* Botón cerrar */}
          <button
            onClick={handleClose}
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
