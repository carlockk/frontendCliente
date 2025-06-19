import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/cart/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

const Navbar = ({ onCartClick }) => {
  const { state } = useCart();
  const { isLogged, user, logout } = useAuth();
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleNavigate = (path) => {
    navigate(path);
    setMenuAbierto(false); // cerrar slide al navegar
  };

  return (
    <nav className="bg-gray-900 shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center text-white">
        {/* Logo con enlace al inicio */}
        <span
          className="flex flex-col items-start cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src="https://frontpos.vercel.app/assets/possail-CUtofc2b.png"
            alt="Logo PosSail"
            className="h-8 sm:h-10 object-contain"
          />
          <span className="text-xs text-gray-400 mt-1 ml-1">
            Sistema de compra en línea
          </span>
        </span>

        {/* Botón hamburguesa móvil */}
        <button
          onClick={() => setMenuAbierto(true)}
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

          <span onClick={() => navigate("/")} className="cursor-pointer hover:underline">
            Menú
          </span>

          {isLogged && (
            <>
              <span
                onClick={() => navigate("/compras")}
                className="cursor-pointer hover:underline"
              >
                Mis Compras
              </span>
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
              onClick={logout}
              className="border border-white px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </div>

      {/* Slide lateral para móviles */}
      {menuAbierto && (
        <div className="fixed inset-0 z-[9998] bg-black bg-opacity-40 flex justify-end sm:hidden">
          <div className="w-64 h-full bg-white text-gray-900 shadow-lg transform translate-x-0 transition-transform duration-300 ease-in-out p-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Menú</h2>
              <button
                onClick={() => setMenuAbierto(false)}
                className="text-xl text-gray-600"
              >
                ✕
              </button>
            </div>

            <span
              onClick={() => handleNavigate("/")}
              className="block cursor-pointer hover:text-blue-600"
            >
              Menú principal
            </span>

            {isLogged && (
              <>
                <span
                  onClick={() => handleNavigate("/compras")}
                  className="block cursor-pointer hover:text-blue-600"
                >
                  Mis Compras
                </span>
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
                  logout();
                  setMenuAbierto(false);
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
