import { useEffect, useState } from "react";

export default function ProductQuickView({ isOpen, toggle, producto }) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
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

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center transition-opacity duration-300 ease-in-out ${
        showAnimation ? "bg-black bg-opacity-40" : "bg-black bg-opacity-0"
      }`}
      onClick={toggle}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white w-full sm:max-w-md h-[90%] sm:h-auto sm:fixed sm:right-0 shadow-xl rounded-t-lg sm:rounded-lg overflow-y-auto transform transition-all duration-500 ease-in-out
        ${showAnimation 
          ? "translate-y-0 sm:translate-x-0 opacity-100" 
          : "translate-y-full sm:translate-x-full opacity-0"
        }`}
      >
        <div className="relative p-5">
          {/* Botón cerrar */}
          <button
            onClick={toggle}
            className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
            aria-label="Cerrar vista rápida"
          >
            ✖
          </button>

          {/* Imagen del producto */}
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

          {/* Productos relacionados */}
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
