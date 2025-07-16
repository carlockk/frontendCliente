import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useAuth } from "../contexts/AuthContext";

const SidebarFiltros = ({ onFiltrar }) => {
  const [categorias, setCategorias] = useState([]);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [vistosRecientes, setVistosRecientes] = useState([]);
  const [mostrarMobile, setMostrarMobile] = useState(false);
  const [toast, setToast] = useState("");

  const { user } = useAuth();

  const mostrarToast = (mensaje) => {
    setToast(mensaje);
    setTimeout(() => setToast(""), 2500);
  };

  const aplicarFiltros = useCallback(() => {
    onFiltrar({
      precioMin,
      precioMax,
      busqueda,
      mostrarFavoritos,
      categoria: categoriaSeleccionada,
    });
  }, [precioMin, precioMax, busqueda, mostrarFavoritos, categoriaSeleccionada, onFiltrar]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await api.get("/categorias");
        const ordenGuardado = localStorage.getItem(`orden_categorias_${user?._id}`);
        if (ordenGuardado) {
          const ordenIds = JSON.parse(ordenGuardado);
          const reordenadas = ordenIds
            .map(id => res.data.find(cat => cat._id === id))
            .filter(Boolean);
          const faltantes = res.data.filter(cat => !ordenIds.includes(cat._id));
          setCategorias([...reordenadas, ...faltantes]);
        } else {
          setCategorias(res.data);
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };

    fetchCategorias();

    const vistos = localStorage.getItem("productos_vistos");
    setVistosRecientes(vistos ? JSON.parse(vistos).slice(0, 2) : []);
  }, [user]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  const handleCategoria = (nombre) => {
    setCategoriaSeleccionada((prev) => (prev === nombre ? null : nombre));
  };

  const limpiarFiltros = () => {
    setPrecioMin("");
    setPrecioMax("");
    setBusqueda("");
    setMostrarFavoritos(false);
    setCategoriaSeleccionada(null);
    onFiltrar({});
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const nuevasCategorias = [...categorias];
    const [moved] = nuevasCategorias.splice(result.source.index, 1);
    nuevasCategorias.splice(result.destination.index, 0, moved);
    setCategorias(nuevasCategorias);

    if (user?._id) {
      const ordenIds = nuevasCategorias.map((c) => c._id);
      localStorage.setItem(`orden_categorias_${user._id}`, JSON.stringify(ordenIds));
      mostrarToast("✅ Orden guardado");
    }
  };

  const restablecerOrden = async () => {
    try {
      localStorage.removeItem(`orden_categorias_${user._id}`);
      const res = await api.get("/categorias");
      setCategorias(res.data);
      mostrarToast("🔄 Orden original restaurado");
    } catch (error) {
      console.error("Error al restablecer orden:", error);
    }
  };

  return (
    <>
      {toast && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded shadow z-[9999] text-sm animate-fadeIn">
          {toast}
        </div>
      )}

      <button
        onClick={() => setMostrarMobile(true)}
        className="block md:hidden bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Filtros
      </button>

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

      <div className="hidden md:block fixed right-0 top-[80px] bottom-[105px] w-64 bg-white border-l border-gray-200 overflow-y-auto z-40">
        <div className="p-4 space-y-6">{renderSidebarContent()}</div>
      </div>
    </>
  );

  function renderSidebarContent() {
    return (
      <div className="space-y-6 text-sm">
        <div>
          <h3 className="font-semibold mb-2 text-gray-700">Buscar producto</h3>
          <input
            type="text"
            placeholder="Ej: Strawberry"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-gray-700">Categorías</h3>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categorias">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-1"
                >
                  {categorias.map((cat, index) => (
                    <Draggable key={cat._id} draggableId={cat._id} index={index}>
                      {(provided, snapshot) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`cursor-pointer p-1 rounded ${
                            categoriaSeleccionada === cat.nombre
                              ? "text-blue-600 font-semibold"
                              : "text-gray-600 hover:text-blue-600"
                          } ${snapshot.isDragging ? "bg-gray-100" : ""}`}
                          onClick={() => handleCategoria(cat.nombre)}
                        >
                          {cat.nombre}
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>

          {user && (
            <button
              onClick={restablecerOrden}
              className="mt-2 text-blue-500 text-xs hover:underline"
            >
              🔄 Restablecer orden original
            </button>
          )}
        </div>

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
