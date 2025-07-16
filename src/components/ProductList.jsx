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
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const topRef = useRef();

  useEffect(() => {
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
    <div className="max-w-7xl mx-auto bg-white" ref={topRef}>
      <h1 className="text-3xl font-bold text-gray-700 mb-6 px-4 pt-6 flex items-center gap-2">
        🧾 Menú disponible
      </h1>

      <div className="flex gap-4">
        {/* Lista de productos */}
        <div className="flex-1">
          {categoriasOrdenadas.map((categoria) => (
            <div key={categoria} className="mb-10">
              {categoria !== "sin_categoria" && (
                <h2 className="text-xl font-semibold text-gray-700 mb-4 px-4 capitalize">
                  ••• {categoria} •••
                </h2>
              )}

              {productosPorCategoria[categoria].map((producto, index) => {
                const descripcionCorta =
                  producto.descripcion?.length > 90
                    ? producto.descripcion.slice(0, 90) + "..."
                    : producto.descripcion;

                const esFavorito = favoritos.includes(producto._id);

                return (
                  <div
                    key={producto._id}
                    className="flex items-center justify-between px-4 py-3 border-t border-dashed border-gray-300"
                  >
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 px-4 text-left">
                      <h2 className="font-bold text-md text-gray-800">{producto.nombre}</h2>
                      <p className="text-sm italic text-gray-600">{descripcionCorta}</p>
                    </div>
                    <div className="text-right text-sm mr-4">
                      <p className="text-gray-600">DESDE</p>
                      <p className="font-semibold text-gray-800">
                        ${producto.precio?.toLocaleString("es-CL")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorito(producto)}
                        className={`text-lg transition hover:scale-110 ${
                          esFavorito ? "text-red-500" : "text-gray-500"
                        }`}
                      >
                        <i className="fas fa-heart"></i>
                      </button>
                      <button
                        onClick={() => abrirVistaRapida(producto)}
                        className="text-lg text-gray-500 hover:text-blue-500 transition hover:scale-110"
                        title="Vista rápida"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        onClick={() => agregarAlCarrito(producto)}
                        className="bg-gray-800 hover:bg-black text-white px-3 py-1 rounded-full"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar lateral en escritorio */}
        <div className="hidden md:block fixed right-0 top-0 bottom-[105px] w-64 bg-white border-l border-gray-200 overflow-y-auto z-40">
          <SidebarFiltros onFiltrar={aplicarFiltros} />
        </div>
      </div>

      {/* Botón para abrir sidebar en móviles */}
      <button
        onClick={() => setMostrarFiltros(true)}
        className="md:hidden fixed bottom-6 right-6 bg-black text-white p-3 rounded-full shadow-lg z-50"
      >
        <i className="fas fa-sliders-h"></i>
      </button>

      {/* Sidebar en móviles */}
      {mostrarFiltros && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="w-72 bg-white p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Filtros</h3>
              <button onClick={() => setMostrarFiltros(false)} className="text-xl text-gray-700">
                ×
              </button>
            </div>
            <SidebarFiltros onFiltrar={aplicarFiltros} />
          </div>
        </div>
      )}

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
