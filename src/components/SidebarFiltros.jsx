import { useEffect, useState } from "react";
import axios from "axios";

const SidebarFiltros = ({ onFiltrar }) => {
  const [categorias, setCategorias] = useState([]);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);
  const [vistosRecientes, setVistosRecientes] = useState([]);
  const [mostrarMobile, setMostrarMobile] = useState(false);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/categorias");
        setCategorias(res.data);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };
    fetchCategorias();

    const vistos = localStorage.getItem("productos_vistos");
    setVistosRecientes(vistos ? JSON.parse(vistos).slice(0, 2) : []);
  }, []);

  const aplicarFiltros = () => {
    onFiltrar({
      precioMin,
      precioMax,
      busqueda,
      mostrarFavoritos,
    });
  };

  const limpiarFiltros = () => {
    setPrecioMin("");
    setPrecioMax("");
    setBusqueda("");
    setMostrarFavoritos(false);
    onFiltrar({}); // limpia desde el padre también
  };

  useEffect(() => {
    aplicarFiltros();
  }, [precioMin, precioMax, busqueda, mostrarFavoritos]);

  return (
    <>
      {/* Botón móvil */}
      <button
        onClick={() => setMostrarMobile(true)}
        className="block md:hidden bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Filtros
      </button>

      {/* Drawer móvil */}
      {mostrarMobile && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-40 flex justify-end md:hidden">
          <div className="bg-white w-72 h-full p-4 overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button onClick={() => setMostrarMobile(false)}>✕</button>
            </div>
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Barra lateral escritorio */}
      <div className="hidden md:block fixed right-0 top-[80px] bottom-[105px] w-64 bg-white border-l border-gray-200 overflow-y-auto z-40">
        <div className="p-4 space-y-6">
          {renderSidebarContent()}
        </div>
      </div>
    </>
  );

  function renderSidebarContent() {
    return (
      <div className="space-y-6 text-sm">
        {/* Busqueda */}
        <div>
          <h3 className="font-semibold mb-2 text-gray-700">Buscar producto</h3>
          <input
            type="text"
            placeholder="Ej: Hamburguesa"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        {/* Categorías */}
        <div>
          <h3 className="font-semibold mb-2 text-gray-700">Categorías</h3>
          <ul className="space-y-1">
            {categorias.map((cat) => (
              <li
                key={cat._id}
                className="cursor-pointer text-gray-600 hover:text-blue-600"
                onClick={() => onFiltrar({ categoria: cat.nombre })}
              >
                {cat.nombre}
              </li>
            ))}
          </ul>
        </div>

        {/* Precio */}
        <div>
          <h3 className="font-semibold mb-2 text-gray-700">Precio</h3>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Mín"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
              className="w-full border px-2 py-1 rounded"
            />
            <input
              type="number"
              placeholder="Máx"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
        </div>

        {/* Favoritos */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarFavoritos}
              onChange={() => setMostrarFavoritos((prev) => !prev)}
            />
            Mostrar solo favoritos
          </label>
        </div>

        {/* Vistos recientemente */}
        {vistosRecientes.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 text-gray-700">Vistos recientemente</h3>
            <ul className="space-y-2">
              {vistosRecientes.map((prod) => (
                <li key={prod._id} className="text-gray-700">
                  <div className="flex items-center gap-2">
                    <img
                      src={prod.imagen_url}
                      alt={prod.nombre}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{prod.nombre}</p>
                      <p className="text-xs text-green-600">
                        ${prod.precio?.toLocaleString("es-CL")}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botón limpiar */}
        <div className="pt-2">
          <button
            onClick={limpiarFiltros}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded text-sm font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    );
  }
};

export default SidebarFiltros;
