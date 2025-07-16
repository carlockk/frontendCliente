import { useEffect, useState, useRef, useCallback } from "react";
import api from "../api";
import { useCart } from "../contexts/cart/CartContext";
import { useAuth } from "../contexts/AuthContext";
import SidebarFiltros from "../components/SidebarFiltros";
import ProductQuickView from "../components/ProductQuickView";

const ProductList = () => {
  const [productos, setProductos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const { dispatch } = useCart();
  const { isLogged, user } = useAuth();
  const [favoritos, setFavoritos] = useState([]);
  const [productoVistaRapida, setProductoVistaRapida] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const topRef = useRef();

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await api.get("/productos");
        const ordenados = res.data.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
        setProductos(ordenados);
        setFiltrados(ordenados);
      } catch (err) {
        console.error("Error al cargar productos:", err);
      }
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    if (isLogged) {
      const guardados = localStorage.getItem(`favoritos_${user._id}`);
      setFavoritos(guardados ? JSON.parse(guardados) : []);
    } else {
      setFavoritos([]);
    }
  }, [isLogged, user]);

  const agregarAlCarrito = (producto) => {
    dispatch({ type: "ADD_ITEM", payload: producto });
  };

  const toggleFavorito = (producto) => {
    if (!isLogged) {
      alert("Debes iniciar sesión para agregar productos a favoritos.");
      return;
    }

    const yaEsta = favoritos.includes(producto._id);
    const nuevos = yaEsta
      ? favoritos.filter((id) => id !== producto._id)
      : [...favoritos, producto._id];

    setFavoritos(nuevos);
    localStorage.setItem(`favoritos_${user._id}`, JSON.stringify(nuevos));

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

  const aplicarFiltros = useCallback(({ precioMin, precioMax, busqueda, mostrarFavoritos, categoria }) => {
    let resultado = [...productos];
    if (precioMin) resultado = resultado.filter((p) => p.precio >= parseInt(precioMin));
    if (precioMax) resultado = resultado.filter((p) => p.precio <= parseInt(precioMax));
    if (busqueda) resultado = resultado.filter((p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
    if (mostrarFavoritos) resultado = resultado.filter((p) => favoritos.includes(p._id));
    if (categoria) resultado = resultado.filter((p) => p.categoria?.nombre === categoria);
    setFiltrados(resultado);
  }, [productos, favoritos]);

  const productosPorCategoria = filtrados.reduce((acc, prod) => {
    const cat = prod.categoria?.nombre || "sin_categoria";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(prod);
    return acc;
  }, {});

  const ordenCategorias = (() => {
    if (!isLogged) return [];
    const raw = localStorage.getItem(`orden_categorias_${user._id}`);
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
    <div className="flex max-w-7xl mx-auto bg-white min-h-screen" ref={topRef}>
      <div className="flex-1 pr-0 md:pr-64">
        <div className="flex items-center justify-between p-4 md:hidden">
          <h1 className="text-xl font-bold text-gray-700">🧾 Menú</h1>
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="text-sm text-blue-600 underline"
          >
            {sidebarVisible ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        {categoriasOrdenadas.map((categoria) => (
          <div key={categoria} className="mb-10">
            {categoria !== "sin_categoria" && (
              <h2 className="text-xl font-semibold text-gray-600 mb-4 px-4 capitalize">
                ••• {categoria} •••
              </h2>
            )}
            <div className="px-4">
              {productosPorCategoria[categoria].map((producto) => {
                const descripcionCorta =
                  producto.descripcion?.length > 70
                    ? producto.descripcion.slice(0, 70) + "..."
                    : producto.descripcion;
                const esFavorito = favoritos.includes(producto._id);

                return (
                  <div key={producto._id} className="flex items-center justify-between py-4 border-t border-dashed border-gray-300">
                    <img src={producto.imagen_url} alt={producto.nombre} className="w-20 h-20 object-cover rounded mr-4" />
                    <div className="flex-1 text-left">
                      <h2 className="font-bold text-sm uppercase">{producto.nombre}</h2>
                      <p className="text-xs italic text-gray-600">{descripcionCorta}</p>
                    </div>
                    <div className="flex flex-col items-end justify-center gap-1 min-w-[85px]">
                      <span className="text-[11px] uppercase text-gray-500 leading-none">Desde</span>
                      <span className="text-green-600 text-sm font-semibold leading-none">
                        ${producto.precio?.toLocaleString("es-CL")}
                      </span>
                      <div className="flex gap-1 mt-1">
                        <button onClick={() => toggleFavorito(producto)} className={`text-lg transition hover:scale-110 ${esFavorito ? "text-red-500" : "text-gray-500"}`} title="Favorito">
                          <i className="fas fa-heart"></i>
                        </button>
                        <button onClick={() => abrirVistaRapida(producto)} className="text-lg text-gray-500 hover:text-blue-500 transition hover:scale-110" title="Vista rápida">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button onClick={() => agregarAlCarrito(producto)} className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-black text-white rounded-full shadow text-sm" title="Agregar al carrito">
                          <i className="fas fa-plus"></i>
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

      {/* Sidebar permanente en desktop y toggleable en móvil */}
      <div className={`fixed top-0 bottom-[105px] right-0 w-64 bg-white border-l border-gray-200 overflow-y-auto z-40 transition-transform transform md:translate-x-0 ${sidebarVisible ? "translate-x-0" : "translate-x-full"} md:block hidden`}>
        <div className="p-4 space-y-6 sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <SidebarFiltros onFiltrar={aplicarFiltros} />
        </div>
      </div>

      {/* Vista rápida */}
      <ProductQuickView
        isOpen={!!productoVistaRapida}
        toggle={() => setProductoVistaRapida(null)}
        producto={productoVistaRapida}
      />
    </div>
  );
};

export default ProductList;
