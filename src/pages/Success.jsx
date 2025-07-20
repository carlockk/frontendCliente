import { Link } from "react-router-dom";

const Success = () => {
  return (
    <div className="p-6 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold text-green-600 mb-4">✅ ¡Pago exitoso!</h1>
      <p className="mb-4">Tu pedido ha sido procesado correctamente. Pronto recibirás una confirmación.</p>
      <Link to="/" className="text-blue-600 underline">Volver al inicio</Link>
    </div>
  );
};

export default Success;
