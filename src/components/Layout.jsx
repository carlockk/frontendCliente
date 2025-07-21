import { useState } from "react";
import Navbar from "./Navbar";
import SlideCart from "./SlideCart"; // Asegúrate de crearlo si no existe

const Layout = ({ children }) => {
  const [isCartOpen, setCartOpen] = useState(false);

  const toggleCart = () => setCartOpen(!isCartOpen);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 relative">
      <Navbar onCartClick={toggleCart} />
      <main className="flex-grow container mx-auto px-4 py-6">{children}</main>
      <footer className="bg-black border-t mt-10 py-6 text-center text-gray-200 ">
        <p className="text-sm mb-2">
          © {new Date().getFullYear()} Mi Empresa - Todos los derechos reservados
        </p>
        <div className="flex justify-center gap-4 text-xl text-gray-600 mt-2">
          <a href="https://facebook.com/coffeeywaffles"><i className="fab fa-facebook"></i></a>
          <a href="https://instagram.com/coffee.waffles"><i className="fab fa-instagram"></i></a>
          {/*<a href="#"><i className="fab fa-whatsapp"></i></a>*/}
        </div>
      </footer>
      <SlideCart isOpen={isCartOpen} toggle={toggleCart} />
    </div>
  );
};

export default Layout;
