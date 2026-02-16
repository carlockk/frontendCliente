import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/cart/CartContext";
import { useLocal } from "../contexts/LocalContext";
import ProductQuickView from "../components/ProductQuickView";

const Favoritos = () => {
  const { isLogged, user } = useAuth();
  const { dispatch } = useCart();
  const { localId } = useLocal();
  const [productos, setProductos] = useState([]);
  const [favoritosIds, setFavoritosIds] = useState([]);
  const [productoVistaRapida, setProductoVistaRapida] = useState(null);
  const [imagenActiva, setImagenActiva] = useState(null);

  useEffect(() => {
    if (isLogged && user?._id) {
      const raw = localStorage.getItem(`favoritos_${user._id}`);
      setFavoritosIds(raw ? JSON.parse(raw) : []);
    } else {
      const raw = localStorage.getItem("favoritos_guest");
      setFavoritosIds(raw ? JSON.parse(raw) : []);
    }
  }, [isLogged, user]);

  useEffect(() => {
    if (!imagenActiva) return;
    const escHandler = (e) => {
      if (e.key === "Escape") setImagenActiva(null);
    };
    window.addEventListener("keydown", escHandler);
    return () => window.removeEventListener("keydown", escHandler);
  }, [imagenActiva]);

  useEffect(() => {
    if (!localId) {
      setProductos([]);
      return;
    }
    const fetchProductos = async () => {
      try {
        const res = await api.get("/productos");
        const ordenados = res.data.sort(
          (a, b) => new Date(b.creado_en) - new Date(a.creado_en)
        );
        setProductos(ordenados);
      } catch (err) {
        console.error("Error al cargar productos:", err);
      }
    };
    fetchProductos();
  }, [localId]);

  const favoritosFiltrados = productos.filter((p) => favoritosIds.includes(p._id));

  const agregarAlCarrito = (producto) => {
    const tieneVariantes =
      Array.isArray(producto.variantes) && producto.variantes.length > 0;
    const tieneAgregados =
      Array.isArray(producto.agregados) &&
      producto.agregados.some((agg) => agg?.nombre && agg?.activo !== false);
    if (tieneVariantes || tieneAgregados) {
      abrirVistaRapida(producto);
      return;
    }
    dispatch({ type: "ADD_ITEM", payload: producto });
  };

  const quitarFavorito = (productoId) => {
    const nuevos = favoritosIds.filter((id) => id !== productoId);
    if (isLogged && user?._id) {
      localStorage.setItem(`favoritos_${user._id}`, JSON.stringify(nuevos));
    } else {
      localStorage.setItem("favoritos_guest", JSON.stringify(nuevos));
    }
    setFavoritosIds(nuevos);
  };

  const abrirVistaRapida = (producto) => {
    const relacionados = productos
      .filter((p) => p.categoria?.nombre === producto.categoria?.nombre && p._id !== producto._id)
      .slice(0, 3);
    setProductoVistaRapida({ ...producto, relacionados });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-700 mb-4">❤️ Mis favoritos</h1>

      {!localId && (
        <div className="mb-6 rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          Debes seleccionar un local para ver tus favoritos.
        </div>
      )}

      {localId && favoritosFiltrados.length === 0 && (
        <p className="text-gray-600">Aún no tienes productos favoritos.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {favoritosFiltrados.map((producto) => {
          const descripcionCorta =
            producto.descripcion?.length > 70
              ? producto.descripcion.slice(0, 70) + "..."
              : producto.descripcion;

          return (
            <div
              key={producto._id}
              className="border-0 border-b border-dashed border-gray-300 pb-4 mb-4 flex gap-3 items-start"
            >
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                className="w-20 h-20 object-cover rounded"
                onClick={() => setImagenActiva(producto)}
                title="Ver imagen completa"
              />
              <div className="flex-1">
                <h2
                  className="font-semibold text-sm cursor-pointer hover:text-blue-600"
                  onClick={() => abrirVistaRapida(producto)}
                  title="Ver vista rápida"
                >
                  {producto.nombre}
                </h2>
                <p className="text-xs text-gray-500">{descripcionCorta}</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-sm font-semibold text-green-600">
                    ${producto.precio?.toLocaleString("es-CL")}
                  </p>
                  <button
                    onClick={() => quitarFavorito(producto._id)}
                    className="text-xl text-red-500 hover:text-red-600 transition hover:scale-110"
                    title="Quitar de favoritos"
                  >
                    <i className="fas fa-heart-broken"></i>
                  </button>
                  <button
                    onClick={() => abrirVistaRapida(producto)}
                    className="text-xl text-gray-500 hover:text-blue-500 transition hover:scale-110"
                    title="Vista rápida"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button
                    onClick={() => agregarAlCarrito(producto)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full shadow"
                    title="Agregar al carrito"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ProductQuickView
        isOpen={!!productoVistaRapida}
        toggle={() => setProductoVistaRapida(null)}
        producto={productoVistaRapida}
        onRemoveFavorite={quitarFavorito}
      />

      {imagenActiva && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setImagenActiva(null)}
        >
          <div
            className="max-w-3xl w-full bg-white rounded shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                {imagenActiva.nombre}
              </h3>
              <button
                onClick={() => setImagenActiva(null)}
                className="text-gray-600 hover:text-black text-xl"
                aria-label="Cerrar imagen"
              >
                ✕
              </button>
            </div>
            <img
              src={imagenActiva.imagen_url}
              alt={imagenActiva.nombre}
              className="w-full h-auto max-h-[70vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Favoritos;
