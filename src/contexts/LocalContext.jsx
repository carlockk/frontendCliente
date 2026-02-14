import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";

const LocalContext = createContext(null);

export const LocalProvider = ({ children }) => {
  const [locales, setLocales] = useState([]);
  const [localId, setLocalId] = useState(
    () => localStorage.getItem("local_id") || ""
  );
  const [localInfo, setLocalInfo] = useState(null);
  const [loadingLocales, setLoadingLocales] = useState(false);
  const [errorLocales, setErrorLocales] = useState("");

  useEffect(() => {
    const fetchLocales = async () => {
      setLoadingLocales(true);
      setErrorLocales("");
      try {
        const res = await api.get("/locales");
        const data = Array.isArray(res.data) ? res.data : [];
        setLocales(data);
        if (localId) {
          const found = data.find((l) => l._id === localId) || null;
          setLocalInfo(found);
        }
      } catch (err) {
        setErrorLocales("No se pudieron cargar los locales.");
      } finally {
        setLoadingLocales(false);
      }
    };

    fetchLocales();
  }, [localId]);

  const selectLocal = (local) => {
    const id = typeof local === "string" ? local : local?._id || "";
    if (id) {
      localStorage.setItem("local_id", id);
    } else {
      localStorage.removeItem("local_id");
    }
    setLocalId(id);
    if (typeof local === "object") {
      setLocalInfo(local);
    } else {
      const found = locales.find((l) => l._id === id) || null;
      setLocalInfo(found);
    }
  };

  const value = useMemo(
    () => ({
      locales,
      localId,
      localInfo,
      loadingLocales,
      errorLocales,
      selectLocal,
    }),
    [locales, localId, localInfo, loadingLocales, errorLocales]
  );

  return <LocalContext.Provider value={value}>{children}</LocalContext.Provider>;
};

export const useLocal = () => {
  const ctx = useContext(LocalContext);
  if (!ctx) {
    throw new Error("useLocal debe usarse dentro de LocalProvider");
  }
  return ctx;
};
