import { useEffect, useState, useRef, useCallback } from "react";
import api from "../api";
import { useCart } from "../contexts/cart/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useLocal } from "../contexts/LocalContext";
import SidebarFiltros from "../components/SidebarFiltros";
import ProductQuickView from "../components/ProductQuickView";
import { getProductAddons } from "../utils/productAddons";

const ProductList = () => {
  const [productos, setProductos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const { dispatch } = useCart();
  const { isLogged, user } = useAuth();
  const { localId } = useLocal();
  const [favoritos, setFavoritos] = useState([]);
  const [productoVistaRapida, setProductoVistaRapida] = useState(null);
  const [imagenActiva, setImagenActiva] = useState(null);
  const topRef = useRef();

  useEffect(() => {
    if (!localId) {
      setProductos([]);
      setFiltrados([]);
      return;
    }
    const fetchProductos = async () => {
      try {
        const res = await api.get("/productos");
        const ordenados = res.data.sort(
          (a, b) => new Date(b.creado_en) - new Date(a.creado_en)
        );
        setProductos(ordenados);
        setFiltrados(ordenados);
      } catch (err) {
        console.error("Error al cargar productos:", err);
      }
    };
    fetchProductos();
  }, [localId]);

  useEffect(() => {
    if (isLogged && user?._id) {
      const guardados = localStorage.getItem(`favoritos_${user._id}`);
      setFavoritos(guardados ? JSON.parse(guardados) : []);
    } else {
      const guardados = localStorage.getItem("favoritos_guest");
      setFavoritos(guardados ? JSON.parse(guardados) : []);
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

  const agregarAlCarrito = (producto) => {
    const tieneVariantes =
      Array.isArray(producto.variantes) && producto.variantes.length > 0;
    const tieneAgregados = getProductAddons(producto).length > 0;
    if (tieneVariantes || tieneAgregados) {
      abrirVistaRapida(producto);
      return;
    }
    dispatch({ type: "ADD_ITEM", payload: producto });
  };

  const toggleFavorito = (producto) => {
    const yaEsta = favoritos.includes(producto._id);
    const nuevos = yaEsta
      ? favoritos.filter((id) => id !== producto._id)
      : [...favoritos, producto._id];

    setFavoritos(nuevos);
    if (isLogged && user?._id) {
      localStorage.setItem(`favoritos_${user._id}`, JSON.stringify(nuevos));
    } else {
      localStorage.setItem("favoritos_guest", JSON.stringify(nuevos));
    }

    let vistos = JSON.parse(localStorage.getItem("productos_vistos")) || [];
    vistos = [producto, ...vistos.filter((p) => p._id !== producto._id)];
    localStorage.setItem("productos_vistos", JSON.stringify(vistos.slice(0, 5)));
  };

  const abrirVistaRapida = (producto) => {
    const relacionados = productos
      .filter((p) => p.categoria?.nombre === producto.categoria?.nombre && p._id !== producto._id)
      .slice(0, 3);
    setProductoVistaRapida({ ...producto, relacionados });
  };

  const aplicarFiltros = useCallback(
    ({ precioMin, precioMax, busqueda, mostrarFavoritos, categoria }) => {
      let resultado = [...productos];
      if (precioMin) resultado = resultado.filter((p) => p.precio >= parseInt(precioMin));
      if (precioMax) resultado = resultado.filter((p) => p.precio <= parseInt(precioMax));
      if (busqueda) resultado = resultado.filter((p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
      if (mostrarFavoritos) resultado = resultado.filter((p) => favoritos.includes(p._id));
      if (categoria) resultado = resultado.filter((p) => p.categoria?.nombre === categoria);

      setFiltrados(resultado);
    },
    [productos, favoritos]
  );

  const productosPorCategoria = filtrados.reduce((acc, prod) => {
    const cat = prod.categoria?.nombre || "sin_categoria";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(prod);
    return acc;
  }, {});

  const ordenCategorias = (() => {
    const usuarioKey = user?._id || "guest";
    const key = `orden_categorias_${usuarioKey}_${localId || "sinlocal"}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  })();

  const categoriasOrdenadas = Object.keys(productosPorCategoria).sort((a, b) => {
    const getIndex = (nombre) => {
      const p = productos.find(p => p.categoria?.nombre === nombre);
      const id = p?.categoria?._id;
      return ordenCategorias.indexOf(id);
    };
    const idxA = getIndex(a);
    const idxB = getIndex(b);

    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  return (
    <>
      <div className="flex w-full items-start" ref={topRef}>
        {/* Contenedor de productos */}
        <div className="flex-1 px-3 md:px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-700 mb-6 flex items-center gap-2">
            <i className="fas fa-utensils text-2xl" aria-hidden="true"></i>
            Menú disponible
          </h1>
          {!localId && (
            <div className="mb-6 rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
              Debes seleccionar un local para ver categorías y productos.
            </div>
          )}

          {categoriasOrdenadas.map((categoria) => (
            <div key={categoria} className="mb-10">
              {categoria !== "sin_categoria" && (
                <h2 className="text-xl font-semibold text-gray-600 mb-4 capitalize">
                  ••• {categoria} •••
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {productosPorCategoria[categoria].map((producto) => {
                  const descripcionCorta =
                    producto.descripcion?.length > 70
                      ? producto.descripcion.slice(0, 70) + "..."
                      : producto.descripcion;
                  const esFavorito = favoritos.includes(producto._id);
                  const tieneVariantes =
                    Array.isArray(producto.variantes) && producto.variantes.length > 0;
                  const agregadosActivos = getProductAddons(producto);
                  const tieneAgregados = agregadosActivos.length > 0;

                  return (
                    <div
                      key={producto._id}
                      className="border-0 border-b border-dashed border-gray-300 pb-2 mb-2 flex gap-3 items-start"
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
                        <p className="text-[11px] mt-1 text-black font-normal">
                          {tieneVariantes
                            ? `${producto.variantes.length} variación(es) disponible(s)`
                            : "Producto sin variaciones"}
                          {tieneAgregados
                            ? ` | ${agregadosActivos.length} agregado(s) opcional(es)`
                            : ""}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-sm font-semibold text-green-600">
                            ${producto.precio?.toLocaleString("es-CL")}
                          </p>
                          <button
                            onClick={() => toggleFavorito(producto)}
                            className={`text-xl transition hover:scale-110 ${
                              esFavorito ? "text-red-500" : "text-gray-500"
                            }`}
                            title="Agregar a favoritos"
                          >
                            <i className="fas fa-heart"></i>
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
            </div>
          ))}
        </div>

        {/* Sidebar escritorio alineado derecha sin margen */}
        <div className="hidden md:block w-[280px] py-6 pr-0">
          <SidebarFiltros onFiltrar={aplicarFiltros} />
        </div>
      </div>

      {/* Sidebar móvil */}
      <div className="md:hidden px-3">
        <SidebarFiltros onFiltrar={aplicarFiltros} />
      </div>

      {/* Vista rápida */}
      <ProductQuickView
        isOpen={!!productoVistaRapida}
        toggle={() => setProductoVistaRapida(null)}
        producto={productoVistaRapida}
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
    </>
  );
};

export default ProductList;
