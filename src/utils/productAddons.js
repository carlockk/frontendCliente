const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toAddon = (item) => {
  if (!item || typeof item !== "object") return null;
  const nombre = String(item.nombre || item.titulo || "").trim();
  if (!nombre) return null;

  return {
    _id: item._id || item.agregadoId || item.id || null,
    agregadoId: item.agregadoId || item._id || item.id || null,
    nombre,
    precio: toNumber(item.precio),
    activo: item.activo !== false,
  };
};

const pushIfAddon = (bucket, item) => {
  const addon = toAddon(item);
  if (addon && addon.activo !== false) bucket.push(addon);
};

export const getProductAddons = (producto) => {
  const bucket = [];
  const direct = Array.isArray(producto?.agregados) ? producto.agregados : [];

  direct.forEach((item) => {
    if (Array.isArray(item?.opciones)) {
      item.opciones.forEach((op) => pushIfAddon(bucket, op));
    } else {
      pushIfAddon(bucket, item);
    }
  });

  const grupos = [
    ...(Array.isArray(producto?.gruposAgregados) ? producto.gruposAgregados : []),
    ...(Array.isArray(producto?.grupos_agregados) ? producto.grupos_agregados : []),
    ...(Array.isArray(producto?.agregadosOpcionales) ? producto.agregadosOpcionales : []),
  ];

  grupos.forEach((grupo) => {
    if (Array.isArray(grupo?.opciones)) {
      grupo.opciones.forEach((op) => pushIfAddon(bucket, op));
      return;
    }
    if (Array.isArray(grupo?.agregados)) {
      grupo.agregados.forEach((op) => pushIfAddon(bucket, op));
      return;
    }
    pushIfAddon(bucket, grupo);
  });

  const seen = new Set();
  return bucket.filter((addon, idx) => {
    const key = String(addon.agregadoId || addon._id || `${addon.nombre}-${idx}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

