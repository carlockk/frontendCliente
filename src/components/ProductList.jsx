import { useEffect, useState } from "react";
import axios from "axios";
import { useCart } from "../contexts/cart/CartContext";
import { useAuth } from "../contexts/AuthContext";
import SidebarFiltros from "../components/SidebarFiltros";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const ProductList = () => {
  const [productos, setProductos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const { dispatch } = useCart();
  const { isLogged, user } = useAuth();
  const [favoritos, setFavoritos] = useState([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await axios.get(`${API_URL}/productos`);
        setProductos(res.data);
        setFiltrados(res.data);
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

  const aplicarFiltros = ({ precioMin, precioMax, busqueda, mostrarFavoritos, categoria }) => {
    let resultado = [...productos];

    if (precioMin) resultado = resultado.filter((p) => p.precio >= parseInt(precioMin));
    if (precioMax) resultado = resultado.filter((p) => p.precio <= parseInt(precioMax));
    if (busqueda) resultado = resultado.filter((p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
    if (mostrarFavoritos) resultado = resultado.filter((p) => favoritos.includes(p._id));
    if (categoria) resultado = resultado.filter((p) => p.categoria === categoria);

    setFiltrados(resultado);
  };

  return (
    <div className="max-w-7xl mx-auto px-0 py-0">
      <h1 className="text-3xl font-bold text-gray-700 mb-6 px-4 pt-6 flex items-center gap-2">
        🧾 Menú disponible
      </h1>

      <div className="flex-1 pr-0 md:pr-64">
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 px-4">
          {filtrados.map((producto) => {
            const descripcionCorta =
              producto.descripcion?.length > 50
                ? producto.descripcion.slice(0, 50) + "..."
                : producto.descripcion;

            const esFavorito = favoritos.includes(producto._id);

            return (
              <div
                key={producto._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-3 flex flex-col relative"
              >
                <button
                  onClick={() => toggleFavorito(producto)}
                  title={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                  className={`absolute top-2 right-2 w-7 h-7 bg-white rounded-md shadow flex items-center justify-center transition-transform hover:scale-110 ${
                    esFavorito ? "text-red-500" : "text-gray-700"
                  }`}
                >
                  <i className="fas fa-heart text-sm"></i>
                </button>

                {producto.imagen_url && (
                  <img
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}

                <h2 className="font-semibold text-sm mb-1">{producto.nombre}</h2>
                <p
                  className="text-xs text-gray-500 mb-2 truncate"
                  title={producto.descripcion}
                >
                  {descripcionCorta}
                </p>
                <p className="text-sm font-semibold text-green-600 mb-3">
                  ${producto.precio?.toLocaleString("es-CL")}
                </p>

                <button
                  onClick={() => agregarAlCarrito(producto)}
                  className="mt-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full flex items-center justify-center gap-2 text-sm shadow transition"
                >
                  <i className="fas fa-cart-plus"></i> Agregar
                </button>
              </div>
            );
          })}
        </div>

        <SidebarFiltros onFiltrar={aplicarFiltros} />
      </div>
    </div>
  );
};

export default ProductList;
