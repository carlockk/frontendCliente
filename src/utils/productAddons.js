const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toStringSafe = (value) => String(value || "").trim();

const normalizeMode = (raw) => {
  const mode = toStringSafe(raw).toLowerCase();
  if (["unico", "unica", "single", "radio", "one", "solo_uno"].includes(mode)) {
    return "unico";
  }
  return "multiple";
};

const getGroupMode = (group) =>
  normalizeMode(
    group?.modoSeleccion ||
      group?.modo ||
      group?.tipoSeleccion ||
      group?.tipo ||
      (group?.multiple === false ? "unico" : "multiple")
  );

const getGroupTitle = (group, fallback = "Agregados") =>
  toStringSafe(group?.titulo || group?.nombre || group?.label || fallback) || fallback;

const getGroupKey = (group, idx = 0) =>
  toStringSafe(group?._id || group?.id || group?.grupoId || `grupo-${idx}`);

const getAddonGroupRef = (addon) => {
  const group = addon?.grupo && typeof addon.grupo === "object" ? addon.grupo : null;
  return {
    key: toStringSafe(group?._id || group?.id || group?.grupoId || addon?.grupoId || "__sin_grupo__"),
    title: getGroupTitle(group, "Agregados"),
    mode: getGroupMode(group),
  };
};

const getAddonGroupRefs = (addon) => {
  const groups = Array.isArray(addon?.grupos) ? addon.grupos : [];
  const normalized = groups
    .map((group) => (group && typeof group === "object" ? group : null))
    .filter(Boolean)
    .map((group) => ({
      key: toStringSafe(group?._id || group?.id || group?.grupoId || "__sin_grupo__"),
      title: getGroupTitle(group, "Agregados"),
      mode: getGroupMode(group),
    }))
    .filter((g) => g.key);

  if (normalized.length > 0) return normalized;
  return [getAddonGroupRef(addon)];
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

const pushGroupItem = (groupsByKey, groupMeta, item) => {
  const addon = toAddon(item);
  if (!addon || addon.activo === false) return;

  const key = groupMeta?.key || "__sin_grupo__";
  if (!groupsByKey.has(key)) {
    groupsByKey.set(key, {
      key,
      titulo: groupMeta?.title || "Agregados",
      modoSeleccion: normalizeMode(groupMeta?.mode),
      opciones: [],
    });
  }

  const current = groupsByKey.get(key);
  current.opciones.push(addon);
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

export const getProductAddonGroups = (producto) => {
  const groupsByKey = new Map();
  const direct = Array.isArray(producto?.agregados) ? producto.agregados : [];

  direct.forEach((item, idx) => {
    if (Array.isArray(item?.opciones)) {
      const meta = {
        key: getGroupKey(item, idx),
        title: getGroupTitle(item),
        mode: getGroupMode(item),
      };
      item.opciones.forEach((op) => pushGroupItem(groupsByKey, meta, op));
      return;
    }

    const refs = getAddonGroupRefs(item);
    refs.forEach((ref) => pushGroupItem(groupsByKey, ref, item));
  });

  const nestedGroups = [
    ...(Array.isArray(producto?.gruposAgregados) ? producto.gruposAgregados : []),
    ...(Array.isArray(producto?.grupos_agregados) ? producto.grupos_agregados : []),
    ...(Array.isArray(producto?.agregadosOpcionales) ? producto.agregadosOpcionales : []),
  ];

  nestedGroups.forEach((group, idx) => {
    const meta = {
      key: getGroupKey(group, idx),
      title: getGroupTitle(group),
      mode: getGroupMode(group),
    };

    if (Array.isArray(group?.opciones)) {
      group.opciones.forEach((op) => pushGroupItem(groupsByKey, meta, op));
      return;
    }
    if (Array.isArray(group?.agregados)) {
      group.agregados.forEach((op) => pushGroupItem(groupsByKey, meta, op));
      return;
    }
    pushGroupItem(groupsByKey, meta, group);
  });

  return Array.from(groupsByKey.values())
    .map((group) => {
      const seen = new Set();
      const opciones = group.opciones.filter((addon, idx) => {
        const key = String(addon.agregadoId || addon._id || `${addon.nombre}-${idx}`);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return { ...group, opciones };
    })
    .filter((group) => group.opciones.length > 0);
};
