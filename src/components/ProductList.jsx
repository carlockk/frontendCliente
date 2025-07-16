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
  const [paginaActual, setPaginaActual] = useState(1);
  const [productoVistaRapida, setProductoVistaRapida] = useState(null);
  const productosPorPagina = 20;
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

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [paginaActual]);

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

      setPaginaActual(1);
      setFiltrados(resultado);
    },
    [productos, favoritos]
  );

  const totalPaginas = Math.ceil(filtrados.length / productosPorPagina);
  const productosPaginados = filtrados.slice(
    (paginaActual - 1) * productosPorPagina,
    paginaActual * productosPorPagina
  );

  // Agrupamos productos por categoría
  const productosPorCategoria = productosPaginados.reduce((acc, prod) => {
    const cat = prod.categoria?.nombre || "sin_categoria";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(prod);
    return acc;
  }, {});

  // Orden de categorías desde localStorage
  const ordenCategorias = (() => {
    if (!isLogged) return [];
    const raw = localStorage.getItem(`orden_categorias_${user._id}`);
    return raw ? JSON.parse(raw) : [];
  })();

  // Ordenamos categorías según el orden guardado
  const categoriasOrdenadas = Object.keys(productosPorCategoria).sort((a, b) => {
    const idxA = ordenCategorias.findIndex((id) =>
      productos.find((p) => p.categoria?.nombre === a && p.categoria?._id === id)
    );
    const idxB = ordenCategorias.findIndex((id) =>
      productos.find((p) => p.categoria?.nombre === b && p.categoria?._id === id)
    );

    if (idxA === -1 && idxB === -1) return a.localeCompare(b); // fallback alfabético
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  return (
    <div className="max-w-7xl mx-auto px-0 py-0" ref={topRef}>
      <h1 className="text-3xl font-bold text-gray-700 mb-6 px-4 pt-6 flex items-center gap-2">
        🧾 Menú disponible
      </h1>

      <div className="flex-1 pr-0 md:pr-64">
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
                  <div
                    key={producto._id}
                    className="flex items-center justify-between bg-white rounded-lg shadow-sm hover:shadow-md transition p-3 mb-4"
                  >
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="w-20 h-20 object-cover rounded mr-4"
                    />
                    <div className="flex-1 text-left">
                      <h2 className="font-semibold text-sm">{producto.nombre}</h2>
                      <p className="text-xs text-gray-500">{descripcionCorta}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-green-600">
                        ${producto.precio?.toLocaleString("es-CL")}
                      </p>
                      <button
                        onClick={() => toggleFavorito(producto)}
                        className={`text-xl transition hover:scale-110 ${
                          esFavorito ? "text-red-500" : "text-gray-500"
                        }`}
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
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Paginación */}
        <div className="flex justify-center items-center gap-2 py-6 flex-wrap">
          <button
            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaActual === 1}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            « Anterior
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1)
            .filter((num) => num === 1 || num === totalPaginas || Math.abs(paginaActual - num) <= 2)
            .map((num, idx, arr) => (
              <span key={num}>
                {idx > 0 && num - arr[idx - 1] > 1 && <span className="px-1">...</span>}
                <button
                  onClick={() => setPaginaActual(num)}
                  className={`px-3 py-1 rounded transition ${
                    paginaActual === num
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {num}
                </button>
              </span>
            ))}

          <button
            onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
            disabled={paginaActual === totalPaginas}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Siguiente »
          </button>
        </div>

        {/* Filtros */}
        <SidebarFiltros onFiltrar={aplicarFiltros} />
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
