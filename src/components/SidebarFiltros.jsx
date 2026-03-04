import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useAuth } from "../contexts/AuthContext";
import { useLocal } from "../contexts/LocalContext";

const SidebarFiltros = ({ onFiltrar, onOrdenCategoriasChange }) => {
  const getId = (value) => {
    if (!value) return null;
    const raw = typeof value === "object" ? value._id : value;
    if (raw === undefined || raw === null) return null;
    return String(raw).trim();
  };

  const buildSidebarCategories = (categorias = []) => {
    const childrenByParent = categorias.reduce((acc, cat) => {
      const parentId = getId(cat?.parent);
      if (!parentId) return acc;
      if (!acc[parentId]) acc[parentId] = [];
      acc[parentId].push(cat._id);
      return acc;
    }, {});

    const hasChildren = (catId) =>
      Array.isArray(childrenByParent[catId]) && childrenByParent[catId].length > 0;

    const hasLeafChild = (catId) =>
      (childrenByParent[catId] || []).some((childId) => !hasChildren(childId));

    return categorias.filter((cat) => {
      const catId = cat?._id;
      const parentId = getId(cat?.parent);
      if (!catId) return false;
      if (hasChildren(catId)) return hasLeafChild(catId);
      return !parentId;
    });
  };

  const emitirOrdenCategorias = (listaCategorias) => {
    onOrdenCategoriasChange?.(
      Array.isArray(listaCategorias) ? listaCategorias.map((cat) => String(cat._id)) : []
    );
  };
  const [categorias, setCategorias] = useState([]);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [vistosRecientes, setVistosRecientes] = useState([]);
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [toast, setToast] = useState("");

  const { user } = useAuth();
  const { localId } = useLocal();
  const usuarioKey = user?._id || "guest";
  const ordenStorageKey = `orden_categorias_${usuarioKey}_${localId || "sinlocal"}`;
  const vistosStorageKey = `productos_vistos_${localId || "sinlocal"}`;

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
      if (!localId) {
        setCategorias([]);
        emitirOrdenCategorias([]);
        return;
      }
      try {
        const res = await api.get("/categorias");
        const data = Array.isArray(res.data) ? res.data : [];
        const categoriasPadre = buildSidebarCategories(data);
        const ordenGuardado = localStorage.getItem(ordenStorageKey);
        if (ordenGuardado) {
          const ordenIds = JSON.parse(ordenGuardado);
          const reordenadas = ordenIds
            .map((id) => categoriasPadre.find((cat) => cat._id === id))
            .filter(Boolean);
          const faltantes = categoriasPadre.filter((cat) => !ordenIds.includes(cat._id));
          const categoriasOrdenadas = [...reordenadas, ...faltantes];
          setCategorias(categoriasOrdenadas);
          emitirOrdenCategorias(categoriasOrdenadas);
        } else {
          setCategorias(categoriasPadre);
          emitirOrdenCategorias(categoriasPadre);
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };

    fetchCategorias();

    const vistos = localStorage.getItem(vistosStorageKey);
    setVistosRecientes(vistos ? JSON.parse(vistos).slice(0, 2) : []);
  }, [user, localId, ordenStorageKey, onOrdenCategoriasChange, vistosStorageKey]);

  useEffect(() => {
    // Evita filtros "fantasma" al cambiar de local (ids de categorías no compatibles entre locales)
    setCategoriaSeleccionada(null);
    setBusqueda("");
    setPrecioMin("");
    setPrecioMax("");
    setMostrarFavoritos(false);
  }, [localId]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  const handleCategoria = (categoriaId) => {
    setCategoriaSeleccionada((prev) => (prev === categoriaId ? null : categoriaId));
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

    const ordenIds = nuevasCategorias.map((c) => c._id);
    localStorage.setItem(ordenStorageKey, JSON.stringify(ordenIds));
    emitirOrdenCategorias(nuevasCategorias);
    mostrarToast("✅ Orden guardado");
  };

  const restablecerOrden = async () => {
    try {
      localStorage.removeItem(ordenStorageKey);
      if (!localId) {
        setCategorias([]);
        return;
      }
      const res = await api.get("/categorias");
      const data = Array.isArray(res.data) ? res.data : [];
      const categoriasPadre = buildSidebarCategories(data);
      setCategorias(categoriasPadre);
      emitirOrdenCategorias(categoriasPadre);
      mostrarToast("🔄 Orden original restaurado");
    } catch (error) {
      console.error("Error al restablecer orden:", error);
    }
  };

  const abrirFiltros = () => {
    setFiltrosVisible(true);
    requestAnimationFrame(() => setFiltrosOpen(true));
  };

  const cerrarFiltros = () => {
    setFiltrosOpen(false);
    setTimeout(() => setFiltrosVisible(false), 200);
  };

  return (
    <>
      {toast && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded shadow z-[9999] text-sm animate-fadeIn">
          {toast}
        </div>
      )}

      <button
  onClick={abrirFiltros}
  className="fixed bottom-1/2 right-4 transform translate-y-1/2 z-50 bg-white text-gray-500 border border-gray-300 rounded-full px-4 py-2 shadow hover:bg-gray-100 md:hidden"
>
  🔍 Filtros
</button>


      {filtrosVisible && (
        <div
          className={`fixed inset-0 z-[9999] flex justify-end md:hidden transition-opacity duration-200 ${
            filtrosOpen ? "bg-black bg-opacity-40" : "bg-black bg-opacity-0"
          }`}
          onClick={cerrarFiltros}
        >
          <div
            className={`bg-white w-72 h-full p-4 overflow-y-auto shadow-lg transform transition-transform duration-200 ease-out ${
              filtrosOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button onClick={cerrarFiltros}>✕</button>
            </div>
            {renderSidebarContent()}
          </div>
        </div>
      )}

      <div className="hidden md:block">
  <div className="p-4 bg-white border border-gray-200 rounded shadow space-y-6 animate-sidebarDock">
    {renderSidebarContent()}
  </div>
</div>

    </>
  );

  function renderSidebarContent() {
    return (
      <div className="space-y-4 text-[13px]">
        <div>
          <h3 className="font-semibold mb-1 text-gray-700">Buscar producto</h3>
          <input
            type="text"
            placeholder="Ej: Strawberry"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <h3 className="font-semibold mb-1 text-gray-700">Categorías</h3>
          {!localId && (
            <p className="text-xs text-gray-500 mb-2">
              Selecciona un local para cargar las categorías.
            </p>
          )}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categorias">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-0.5"
                >
                  {categorias.map((cat, index) => (
                    <Draggable key={cat._id} draggableId={cat._id} index={index}>
                      {(provided, snapshot) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`cursor-pointer p-1 rounded ${
                            categoriaSeleccionada === cat._id
                              ? "text-blue-600 font-semibold"
                              : "text-gray-600 hover:text-blue-600"
                          } ${snapshot.isDragging ? "bg-gray-100" : ""}`}
                          onClick={() => handleCategoria(cat._id)}
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

          <button
            onClick={restablecerOrden}
            className="mt-2 text-blue-500 text-xs hover:underline"
          >
            🔄 Restablecer orden original
          </button>
        </div>

        <div>
          <h3 className="font-semibold mb-1 text-gray-700">Precio</h3>
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
            <h3 className="font-semibold mb-1 text-gray-700">Vistos recientemente</h3>
            <ul className="space-y-1.5">
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
