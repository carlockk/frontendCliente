const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getAddonName = (raw) =>
  String(
    raw?.nombre ||
      raw?.titulo ||
      raw?.label ||
      raw?.agregadoNombre ||
      raw?.agregado?.nombre ||
      raw?.opcion?.nombre ||
      ""
  ).trim();

export const normalizeOrderAddons = (raw) => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((agg) => {
      if (!agg) return null;

      if (typeof agg === "string") {
        const nombre = agg.trim();
        return nombre ? { agregadoId: null, nombre, precio: 0 } : null;
      }

      const nombre = getAddonName(agg);
      if (!nombre) return null;

      return {
        agregadoId: agg.agregadoId || agg._id || agg.id || agg?.agregado?._id || null,
        nombre,
        precio: toNumber(
          agg.precio ?? agg.valor ?? agg.monto ?? agg?.agregado?.precio ?? agg?.opcion?.precio
        ),
      };
    })
    .filter(Boolean);
};

export const formatOrderAddon = (addon) => {
  const precio = toNumber(addon?.precio);
  return precio > 0
    ? `${addon.nombre} (+$${precio.toLocaleString("es-CL")})`
    : addon.nombre;
};
