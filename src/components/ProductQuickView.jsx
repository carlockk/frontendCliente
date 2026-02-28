import { useEffect, useState } from "react";
import { useCart } from "../contexts/cart/CartContext";
import { getProductAddonGroups } from "../utils/productAddons";

export default function ProductQuickView({ isOpen, toggle, producto, onRemoveFavorite }) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [varianteSeleccionadaKey, setVarianteSeleccionadaKey] = useState("");
  const [agregadosSeleccionados, setAgregadosSeleccionados] = useState([]);
  const { dispatch } = useCart();

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(false);
      setCantidad(1); // Reiniciar cantidad cada vez que abre
      setVarianteSeleccionadaKey("");
      setAgregadosSeleccionados([]);
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
  const variantes = Array.isArray(producto.variantes) ? producto.variantes : [];
  const gruposAgregados = getProductAddonGroups(producto);
  const tieneVariantes = variantes.length > 0;
  const getVarianteKey = (v, idx) => String(v?._id || `idx-${idx}`);
  const varianteSeleccionadaIndice = variantes.findIndex(
    (v, idx) => getVarianteKey(v, idx) === varianteSeleccionadaKey
  );
  const varianteSeleccionada =
    varianteSeleccionadaIndice >= 0 ? variantes[varianteSeleccionadaIndice] : null;

  const normalizarAgregado = (agg) => ({
    agregadoId: agg._id || agg.agregadoId || null,
    nombre: agg.nombre,
    precio: Number(agg.precio) || 0,
    grupoKey: agg.grupoKey || "__sin_grupo__",
  });

  const buildAgregadosKey = (agregados = []) =>
    [...agregados]
      .map((agg) => String(agg.agregadoId || agg.nombre || ""))
      .sort()
      .join("|");

  const toggleAgregado = (agregado, grupoKey) => {
    const agregadoId = agregado._id || agregado.agregadoId || agregado.nombre || null;
    setAgregadosSeleccionados((prev) => {
      const existe = prev.some((item) => item.agregadoId === agregadoId);
      if (existe) {
        return prev.filter((item) => item.agregadoId !== agregadoId);
      }
      return [...prev, normalizarAgregado({ ...agregado, grupoKey })];
    });
  };

  const seleccionarUnico = (agregado, grupoKey) => {
    const agregadoId = agregado._id || agregado.agregadoId || agregado.nombre || null;
    if (!agregadoId) return;

    setAgregadosSeleccionados((prev) => {
      const sinGrupo = prev.filter((item) => item.grupoKey !== grupoKey);
      return [...sinGrupo, normalizarAgregado({ ...agregado, grupoKey })];
    });
  };

  const agregarAlCarrito = () => {
    if (tieneVariantes && !varianteSeleccionada) {
      alert("Debes elegir una variación.");
      return;
    }

    const precioBase =
      typeof varianteSeleccionada?.precio === "number"
        ? varianteSeleccionada.precio
        : producto.precio;
    const totalAgregados = agregadosSeleccionados.reduce(
      (acc, agg) => acc + (Number(agg.precio) || 0),
      0
    );
    const precioFinal = (Number(precioBase) || 0) + totalAgregados;
    const agregadosKey = buildAgregadosKey(agregadosSeleccionados);

    dispatch({
      type: "ADD_ITEM",
      payload: {
        ...producto,
        precioBase: Number(precioBase) || 0,
        precioAgregados: totalAgregados,
        precio: precioFinal,
        varianteId: varianteSeleccionada?._id || null,
        varianteKey: varianteSeleccionadaKey || null,
        varianteNombre: varianteSeleccionada
          ? [
              varianteSeleccionada.nombre,
              varianteSeleccionada.color,
              varianteSeleccionada.talla,
            ]
              .filter(Boolean)
              .join(" - ")
          : null,
        agregados: agregadosSeleccionados,
        idCarrito: `${producto._id}::${
          varianteSeleccionada?._id || varianteSeleccionadaKey || "base"
        }::${agregadosKey || "sin-agregados"}`,
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
        className={`bg-white w-full sm:max-w-md h-full sm:h-screen max-h-screen sm:fixed sm:right-0 sm:top-0 shadow-xl rounded-none sm:rounded-none overflow-y-auto transform transition-transform duration-300 ${
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
            ${(
              (typeof varianteSeleccionada?.precio === "number"
                ? varianteSeleccionada.precio
                : producto.precio || 0) +
              agregadosSeleccionados.reduce((acc, agg) => acc + (Number(agg.precio) || 0), 0)
            ).toLocaleString("es-CL")}
          </p>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Variaciones</h3>
            {tieneVariantes ? (
              <ul className="space-y-2">
                {variantes.map((v, idx) => (
                  <li key={v._id || `${producto._id}-var-${idx}`} className="text-xs text-gray-600">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`variante-${producto._id}`}
                        checked={varianteSeleccionadaKey === getVarianteKey(v, idx)}
                        onChange={() => setVarianteSeleccionadaKey(getVarianteKey(v, idx))}
                      />
                      <span>
                        {v.nombre}
                        {v.color ? ` - ${v.color}` : ""}
                        {v.talla ? ` - ${v.talla}` : ""}
                        {typeof v.precio === "number"
                          ? ` - $${v.precio.toLocaleString("es-CL")}`
                          : ""}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">Producto sin variaciones</p>
            )}
          </div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Agregados opcionales</h3>
            {gruposAgregados.length > 0 ? (
              <div className="space-y-3">
                {gruposAgregados.map((grupo, gIdx) => (
                  <div key={grupo.key || `grupo-${gIdx}`} className="rounded border border-gray-100 p-2">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      {grupo.titulo} {grupo.modoSeleccion === "unico" ? "(elige uno)" : "(elige uno o varios)"}
                    </p>
                    <ul className="space-y-2">
                      {grupo.opciones.map((agg, idx) => {
                        const agregadoId = agg._id || agg.agregadoId || `${agg.nombre}-${idx}`;
                        const checked = agregadosSeleccionados.some(
                          (item) =>
                            item.agregadoId ===
                            (agg._id || agg.agregadoId || agg.nombre || null)
                        );
                        return (
                          <li key={agregadoId} className="text-xs text-gray-600">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type={grupo.modoSeleccion === "unico" ? "radio" : "checkbox"}
                                name={grupo.modoSeleccion === "unico" ? `grupo-${grupo.key}` : undefined}
                                checked={checked}
                                onChange={() =>
                                  grupo.modoSeleccion === "unico"
                                    ? seleccionarUnico(agg, grupo.key)
                                    : toggleAgregado(agg, grupo.key)
                                }
                              />
                              <span>
                                {agg.nombre}
                                {Number(agg.precio) > 0
                                  ? ` - +$${Number(agg.precio).toLocaleString("es-CL")}`
                                  : " - Incluido"}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Este producto no tiene agregados configurados</p>
            )}
          </div>
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
