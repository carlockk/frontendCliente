import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import SlideCart from "./SlideCart"; // Asegúrate de crearlo si no existe
import Footer from "./Footer";

const Layout = ({ children }) => {
  const [isCartOpen, setCartOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const toggleCart = () => setCartOpen(!isCartOpen);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 260);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 relative">
      <Navbar onCartClick={toggleCart} />
      <main className="flex-grow w-full max-w-[1700px] mx-auto px-5 md:px-6 py-6">{children}</main>
      <Footer />
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-[9998] h-10 w-10 rounded-md bg-black text-white shadow-md hover:bg-gray-800"
          aria-label="Subir"
          title="Subir"
        >
          ↑
        </button>
      )}
      <SlideCart isOpen={isCartOpen} toggle={toggleCart} />
    </div>
  );
};

export default Layout;
