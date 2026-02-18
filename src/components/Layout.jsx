import { useState } from "react";
import Navbar from "./Navbar";
import SlideCart from "./SlideCart"; // Asegúrate de crearlo si no existe
import Footer from "./Footer";

const Layout = ({ children }) => {
  const [isCartOpen, setCartOpen] = useState(false);

  const toggleCart = () => setCartOpen(!isCartOpen);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 relative">
      <Navbar onCartClick={toggleCart} />
      <main className="flex-grow container mx-auto px-4 py-6">{children}</main>
      <Footer />
      <SlideCart isOpen={isCartOpen} toggle={toggleCart} />
    </div>
  );
};

export default Layout;
