import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/cart/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useLocal } from "../contexts/LocalContext";
import { useWebSchedule } from "../contexts/WebScheduleContext";
import api from "../api";

const Navbar = ({ onCartClick }) => {
  const { state } = useCart();
  const { isLogged, user, logout } = useAuth();
  const { locales, localId, loadingLocales, errorLocales, selectLocal } = useLocal();
  const { hasSchedule, isOpenNow, closedMessage } = useWebSchedule();
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const navigate = useNavigate();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const defaultLogo =
    import.meta.env.VITE_DEFAULT_LOGO_URL || "/possail.png";
  const [logoUrl, setLogoUrl] = useState(defaultLogo);

  const handleNavigate = (path) => {
    navigate(path);
    cerrarMenu(); // cerrar slide al navegar
  };

  const handleLogout = () => {
    const confirmar = window.confirm("¿Estás seguro de que deseas cerrar sesión?");
    if (confirmar) {
      logout();
    }
  };

  const abrirMenu = () => {
    setMenuVisible(true);
    requestAnimationFrame(() => setMenuOpen(true));
  };

  const cerrarMenu = () => {
    setMenuOpen(false);
    setTimeout(() => setMenuVisible(false), 200);
  };

  useEffect(() => {
    const cargarLogo = async () => {
      if (!localId) {
        setLogoUrl(defaultLogo);
        const link = document.querySelector("link[rel='icon']");
        if (link) link.href = defaultLogo;
        return;
      }

      try {
        const res = await api.get("/social-config/public");
        const logo = String(res?.data?.logo_url || "").trim() || defaultLogo;
        setLogoUrl(logo);
        const link = document.querySelector("link[rel='icon']");
        if (link) link.href = logo;
      } catch {
        setLogoUrl(defaultLogo);
        const link = document.querySelector("link[rel='icon']");
        if (link) link.href = defaultLogo;
      }
    };

    cargarLogo();
  }, [defaultLogo, localId]);

  return (
    <nav className="bg-gray-900 shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center text-white">
        {/* Logo con enlace al inicio */}
        <span
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src={logoUrl}
            alt="Logo PosSail"
            className="h-8 sm:h-10 object-contain"
          />
          <span className="text-xs text-gray-400 ml-2">
            Sistema de compra en línea
          </span>
        </span>

        {/* Botón hamburguesa móvil */}
        <button
          onClick={abrirMenu}
          className="sm:hidden text-white text-2xl"
        >
          ☰
        </button>

        {/* Menú en pantallas grandes */}
        <div className="hidden sm:flex items-center space-x-4 text-sm">
          {isLogged && (
            <span className="hidden sm:inline">
              Bienvenido, <strong>{user.nombre}</strong>
            </span>
          )}

          {/* Selector de local */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="text-gray-300">Elige un local para comprar</span>
            <div className="flex flex-col">
              <select
                className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-xs"
                value={localId || ""}
                onChange={(e) => selectLocal(e.target.value)}
                disabled={loadingLocales}
              >
                <option value="">
                  {loadingLocales ? "Cargando locales..." : "Selecciona un local"}
                </option>
                {locales.map((local) => (
                  <option key={local._id} value={local._id}>
                    {local.nombre}
                  </option>
                ))}
              </select>
              {errorLocales && (
                <span className="text-[10px] text-red-300">{errorLocales}</span>
              )}
            </div>
          </div>

          <span onClick={() => navigate("/")} className="cursor-pointer hover:underline">
            Menú
          </span>

          <span
            onClick={() => navigate("/favoritos")}
            className="cursor-pointer hover:underline"
          >
            Mis Favoritos
          </span>

          <span
            onClick={() => navigate("/compras")}
            className="cursor-pointer hover:underline"
          >
            Mis Compras
          </span>

          {isLogged && (
            <>
              <span
                onClick={() => navigate("/perfil")}
                className="cursor-pointer hover:underline"
              >
                Perfil
              </span>
            </>
          )}

          <button
            onClick={onCartClick}
            className="relative bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:bg-gray-100"
          >
            Ver carrito
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </button>

          {!isLogged ? (
            <button
              onClick={() => navigate("/login")}
              className="border border-white px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition"
            >
              Iniciar sesión
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="border border-white px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition"
            >
              Cerrar sesión
            </button>
          )}

        </div>
      </div>

      {localId && hasSchedule && !isOpenNow && (
        <div className="bg-red-700 text-white text-xs sm:text-sm px-4 py-2 text-center">
          {closedMessage}
        </div>
      )}

      {/* Slide lateral para móviles */}
      {menuVisible && (
        <div
          className={`fixed inset-0 z-[9998] flex justify-end sm:hidden transition-opacity duration-200 ${
            menuOpen ? "bg-black bg-opacity-40" : "bg-black bg-opacity-0"
          }`}
          onClick={cerrarMenu}
        >
          <div
            className={`w-64 h-full bg-white text-gray-900 shadow-lg transform transition-transform duration-200 ease-out p-4 space-y-4 ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Menú</h2>
              <button
                onClick={cerrarMenu}
                className="text-xl text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-500">Elige un local para comprar</p>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={localId || ""}
                onChange={(e) => selectLocal(e.target.value)}
                disabled={loadingLocales}
              >
                <option value="">
                  {loadingLocales ? "Cargando locales..." : "Selecciona un local"}
                </option>
                {locales.map((local) => (
                  <option key={local._id} value={local._id}>
                    {local.nombre}
                  </option>
                ))}
              </select>
              {errorLocales && (
                <p className="text-xs text-red-600">{errorLocales}</p>
              )}
            </div>

            <span
              onClick={() => handleNavigate("/")}
              className="block cursor-pointer hover:text-blue-600"
            >
              Menú principal
            </span>

            <span
              onClick={() => handleNavigate("/favoritos")}
              className="block cursor-pointer hover:text-blue-600"
            >
              Mis Favoritos
            </span>

            <span
              onClick={() => handleNavigate("/compras")}
              className="block cursor-pointer hover:text-blue-600"
            >
              Mis Compras
            </span>

            {isLogged && (
              <>
                <span
                  onClick={() => handleNavigate("/perfil")}
                  className="block cursor-pointer hover:text-blue-600"
                >
                  Perfil
                </span>
              </>
            )}

            <span
              onClick={onCartClick}
              className="block cursor-pointer hover:text-blue-600"
            >
              Ver carrito ({totalItems})
            </span>

            {!isLogged ? (
              <span
                onClick={() => handleNavigate("/login")}
                className="block cursor-pointer hover:text-blue-600"
              >
                Iniciar sesión
              </span>
            ) : (
                <span
                  onClick={() => {
                    const confirmar = window.confirm("¿Estás seguro de que deseas cerrar sesión?");
                    if (confirmar) {
                      logout();
                      cerrarMenu();
                    }
                  }}
                  className="block cursor-pointer hover:text-blue-600"
                >
                  Cerrar sesión
              </span>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

