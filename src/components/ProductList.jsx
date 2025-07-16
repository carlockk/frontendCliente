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

  const fetchProductos = async () => {
    try {
      const res = await api.get("/productos");
      const ordenados = res.data.sort(
        (a, b) => new Date(b.creado) - new Date(a.creado)
      );
      setProductos(ordenados);
    } catch (err) {
      console.error("Error al cargar productos:", err);
    }
  };

  const fetchFavoritos = async () => {
    try {
      if (isLogged) {
        const res = await api.get(`/favoritos/${user._id}`);
        setFavoritos(res.data);
      }
    } catch (err) {
      console.error("Error al obtener favoritos:", err);
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchFavoritos();
  }, [isLogged, user]);

  const aplicarFiltros = useCallback(
    ({ precioMin, precioMax, busqueda, mostrarFavoritos, categoria }) => {
      let filtrados = [...productos];

      if (precioMin) {
        filtrados = filtrados.filter(p => p.precio >= parseFloat(precioMin));
      }

      if (precioMax) {
        filtrados = filtrados.filter(p => p.precio <= parseFloat(precioMax));
      }

      if (busqueda) {
        const term = busqueda.toLowerCase();
        filtrados = filtrados.filter(p =>
          p.nombre.toLowerCase().includes(term)
        );
      }

      if (categoria) {
        filtrados = filtrados.filter(p => p.categoria === categoria);
      }

      if (mostrarFavoritos && isLogged) {
        const favIds = favoritos.map(f => f.producto_id);
        filtrados = filtrados.filter(p => favIds.includes(p._id));
      }

      setFiltrados(filtrados);
      setPaginaActual(1);
      if (topRef.current) topRef.current.scrollIntoView({ behavior: "smooth" });
    },
    [productos, favoritos, isLogged]
  );

  const handleAgregar = (producto) => {
    dispatch({ type: "ADD_ITEM", payload: producto });
  };

  const productosAMostrar = filtrados.length > 0 ? filtrados : productos;
  const totalPaginas = Math.ceil(productosAMostrar.length / productosPorPagina);
  const productosPaginados = productosAMostrar.slice(
    (paginaActual - 1) * productosPorPagina,
    paginaActual * productosPorPagina
  );

  const cambiarPagina = (nueva) => {
    setPaginaActual(nueva);
    if (topRef.current) topRef.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col md:flex-row">
      <div className="flex-1 p-4" ref={topRef}>
        <div className="grid gap-4">
          {productosPaginados.map((p) => (
            <div
              key={p._id}
              className="flex flex-col md:flex-row items-start md:items-center gap-4 border-b pb-4"
            >
              <img
                src={p.imagen_url}
                alt={p.nombre}
                className="w-24 h-24 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{p.nombre}</h3>
                <p className="text-gray-500">{p.descripcion}</p>
              </div>
              <div className="text-right space-y-2">
                <p className="text-green-600 font-bold">
                  ${p.precio?.toLocaleString("es-CL")}
                </p>
                <div className="flex justify-end gap-2">
                  {isLogged && (
                    <button
                      onClick={() => toggleFavorito(p._id)}
                      title="Favorito"
                      className={`text-xl ${
                        favoritos.some(f => f.producto_id === p._id)
                          ? "text-red-500"
                          : "text-gray-400 hover:text-red-400"
                      }`}
                    >
                      ♥
                    </button>
                  )}
                  <button
                    onClick={() => setProductoVistaRapida(p)}
                    title="Vista rápida"
                    className="text-gray-600 hover:text-blue-600 text-xl"
                  >
                    👁
                  </button>
                  <button
                    onClick={() => handleAgregar(p)}
                    title="Agregar"
                    className="text-white bg-blue-600 hover:bg-blue-700 rounded-full px-3 py-1 text-xl"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i}
                onClick={() => cambiarPagina(i + 1)}
                className={`px-3 py-1 rounded ${
                  i + 1 === paginaActual
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar filtros */}
      <div className="hidden md:block fixed right-0 top-0 bottom-[105px] w-64 bg-white border-l border-gray-200 overflow-y-auto z-40">
        <SidebarFiltros onFiltrar={aplicarFiltros} />
      </div>

      {/* Vista rápida */}
      {productoVistaRapida && (
        <ProductQuickView
          producto={productoVistaRapida}
          onClose={() => setProductoVistaRapida(null)}
        />
      )}
    </div>
  );

  function toggleFavorito(productoId) {
    const yaEsFavorito = favoritos.some(f => f.producto_id === productoId);
    if (yaEsFavorito) {
      api
        .delete(`/favoritos/${user._id}/${productoId}`)
        .then(() => fetchFavoritos())
        .catch(err => console.error(err));
    } else {
      api
        .post("/favoritos", { usuario_id: user._id, producto_id: productoId })
        .then(() => fetchFavoritos())
        .catch(err => console.error(err));
    }
  }
};

export default ProductList;
