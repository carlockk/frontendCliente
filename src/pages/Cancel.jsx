import { Link } from "react-router-dom";

const Cancel = () => {
  return (
    <div className="p-6 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Pago cancelado</h1>
      <p className="mb-4">Tu pago fue cancelado o hubo un error. Puedes volver a intentarlo.</p>
      <Link to="/checkout" className="text-blue-600 underline">Volver al Checkout</Link>
    </div>
  );
};

export default Cancel;
