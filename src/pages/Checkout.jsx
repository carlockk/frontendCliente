import { useCart } from "../contexts/cart/CartContext";
import api from "../api";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLocal } from "../contexts/LocalContext";
import { useWebSchedule } from "../contexts/WebScheduleContext";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const Checkout = () => {
  const { state, dispatch } = useCart();
  const { user } = useAuth();
  const { localId, locales } = useLocal();
  const { hasSchedule, isOpenNow, closedMessage, todayScheduleText, isPickupTimeAllowed } =
    useWebSchedule();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [metodoPago, setMetodoPago] = useState("");
  const [tipoPagoEfectivo, setTipoPagoEfectivo] = useState("");
  const [tipoPedido, setTipoPedido] = useState("tienda");
  const [horaRetiro, setHoraRetiro] = useState("");
  const [notaEfectivo, setNotaEfectivo] = useState("");
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState("");
  const [sugerenciasDireccion, setSugerenciasDireccion] = useState([]);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoCoords, setGeoCoords] = useState(null);

  const [cliente, setCliente] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    correo: "",
    codigoPostal: "",
  });
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const placesContainerRef = useRef(null);
  const debounceDireccionRef = useRef(null);
  const isMountedRef = useRef(true);

  const handleInput = (e) => {
    setCliente({ ...cliente, [e.target.name]: e.target.value });
  };
  const handleDireccionInput = (e) => {
    const value = e.target.value;
    setCliente((prev) => ({ ...prev, direccion: value }));
  };
  const limpiarSugerenciasDireccion = () => {
    setSugerenciasDireccion([]);
    setBuscandoDireccion(false);
  };
  const obtenerPrediccionesDireccion = (query, options = {}) => {
    if (!autocompleteServiceRef.current || !window.google?.maps?.places) {
      return;
    }

    const request = {
      input: query,
      sessionToken: sessionTokenRef.current || undefined,
    };

    if (options?.coords?.lat && options?.coords?.lng && window.google?.maps?.LatLng) {
      request.location = new window.google.maps.LatLng(options.coords.lat, options.coords.lng);
      request.radius = 2500;
    }

    autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
      if (!isMountedRef.current) return;
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
        setSugerenciasDireccion([]);
        setBuscandoDireccion(false);
        return;
      }
      setSugerenciasDireccion(
        predictions.slice(0, 5).map((item) => ({
          placeId: item.place_id,
          texto: item.description,
        }))
      );
      setBuscandoDireccion(false);
    });
  };

  useEffect(() => {
    if (metodoPago !== "efectivo") {
      setTipoPagoEfectivo("");
      setNotaEfectivo("");
      return;
    }

    if (tipoPedido === "delivery") {
      setTipoPagoEfectivo("domicilio");
      return;
    }

    if (tipoPagoEfectivo === "domicilio") {
      setTipoPagoEfectivo("");
    }
  }, [metodoPago, tipoPedido, tipoPagoEfectivo]);

  useEffect(() => {
    if (tipoPedido !== "retiro") {
      setHoraRetiro("");
    }
  }, [tipoPedido]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceDireccionRef.current) {
        clearTimeout(debounceDireccionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;

    const setServices = () => {
      if (!window.google?.maps?.places) return false;

      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        placesContainerRef.current || document.createElement("div")
      );
      geocoderRef.current = new window.google.maps.Geocoder();
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      setMapsReady(true);
      setMapsError("");
      return true;
    };

    if (setServices()) return;

    const existingScript = document.querySelector(
      'script[data-google-maps="places-autocomplete"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", setServices);
      existingScript.addEventListener("error", () => {
        setMapsError("No se pudo cargar Google Maps.");
      });
      return () => {
        existingScript.removeEventListener("load", setServices);
      };
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-maps", "places-autocomplete");
    script.onload = () => {
      if (!setServices()) {
        setMapsError("No se pudo inicializar Google Maps.");
      }
    };
    script.onerror = () => {
      setMapsError("No se pudo cargar Google Maps.");
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (tipoPedido !== "delivery") {
      limpiarSugerenciasDireccion();
      return;
    }
    if (!mapsReady || !autocompleteServiceRef.current) return;

    const query = cliente.direccion?.trim() || "";
    if (!query || query.length < 3) {
      limpiarSugerenciasDireccion();
      return;
    }

    if (debounceDireccionRef.current) {
      clearTimeout(debounceDireccionRef.current);
    }

    setBuscandoDireccion(true);
    debounceDireccionRef.current = setTimeout(() => {
      obtenerPrediccionesDireccion(query, { coords: geoCoords });
    }, 300);
  }, [cliente.direccion, mapsReady, tipoPedido, geoCoords]);

  const seleccionarSugerenciaDireccion = (sugerencia) => {
    const placeId = sugerencia?.placeId;
    if (!placeId || !placesServiceRef.current) {
      setCliente((prev) => ({ ...prev, direccion: sugerencia?.texto || prev.direccion }));
      limpiarSugerenciasDireccion();
      return;
    }

    placesServiceRef.current.getDetails(
      {
        placeId,
        fields: ["formatted_address", "name"],
        sessionToken: sessionTokenRef.current || undefined,
      },
      (place, status) => {
        const finalAddress =
          status === window.google.maps.places.PlacesServiceStatus.OK
            ? place?.formatted_address || place?.name || sugerencia.texto
            : sugerencia.texto;

        setCliente((prev) => ({ ...prev, direccion: finalAddress || prev.direccion }));
        limpiarSugerenciasDireccion();
        if (window.google?.maps?.places?.AutocompleteSessionToken) {
          sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }
      }
    );
  };

  const usarUbicacionActual = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalizacion.");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (!geocoderRef.current) {
          setCliente((prev) => ({
            ...prev,
            direccion: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          }));
          setGeoCoords({ lat, lng });
          setGeoLoading(false);
          return;
        }

        geocoderRef.current.geocode(
          { location: { lat, lng } },
          (results, status) => {
            const direccion =
              status === "OK" && Array.isArray(results) && results[0]?.formatted_address
                ? results[0].formatted_address
                : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

            setGeoCoords({ lat, lng });
            const confirma = window.confirm(
              `Detectamos esta direccion:\n${direccion}\n\n¿Quieres usarla?`
            );

            if (confirma) {
              setCliente((prev) => ({ ...prev, direccion }));
              setBuscandoDireccion(true);
              obtenerPrediccionesDireccion(direccion, { coords: { lat, lng } });
            } else {
              setBuscandoDireccion(true);
              obtenerPrediccionesDireccion(cliente.direccion || " ", { coords: { lat, lng } });
            }
            setGeoLoading(false);
          }
        );
      },
      () => {
        setGeoLoading(false);
        alert("No se pudo obtener tu ubicacion actual.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const getAgregadosKey = (agregados = []) =>
    Array.isArray(agregados) && agregados.length > 0
      ? agregados
          .map((agg) => String(agg?.agregadoId || agg?._id || agg?.nombre || ""))
          .filter(Boolean)
          .sort()
          .join("|")
      : "sin-agregados";

  const redirigirAWebpay = ({ url, token }) => {
    if (!url || !token) {
      throw new Error("Respuesta de Webpay incompleta");
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;
    form.style.display = "none";

    const tokenField = document.createElement("input");
    tokenField.type = "hidden";
    tokenField.name = "token_ws";
    tokenField.value = token;

    form.appendChild(tokenField);
    document.body.appendChild(form);
    form.submit();
  };

  const validarFormulario = (esPagoOnline = false) => {
    if (!state.items || state.items.length === 0) {
      alert("El carrito está vacío.");
      navigate("/");
      return false;
    }

    if (!cliente.nombre || !cliente.telefono) {
      alert("Nombre y teléfono son obligatorios.");
      return false;
    }

    if (!localId) {
      alert("Debes seleccionar un local para continuar.");
      return false;
    }

    if (tipoPedido === "delivery" && !cliente.direccion) {
      alert("Debes ingresar una dirección para delivery.");
      return false;
    }

    if (hasSchedule && !isOpenNow) {
      alert(closedMessage || "El sitio esta cerrado por horario de atencion.");
      return false;
    }

    if (tipoPedido === "retiro") {
      if (!horaRetiro) {
        alert("Debes indicar la hora de retiro.");
        return false;
      }
      if (!isPickupTimeAllowed(horaRetiro, new Date().getDay())) {
        alert("La hora de retiro debe estar dentro del horario de atencion de hoy.");
        return false;
      }
    }

    if (!esPagoOnline) {
      switch (metodoPago) {
        case "":
          alert("Selecciona un método de pago.");
          return false;
        case "efectivo":
          if (!tipoPagoEfectivo) {
            alert("Selecciona dónde pagarás el efectivo.");
            return false;
          }
          break;
        default:
          break;
      }
    }

    return true;
  };

  const crearOrden = async () => {
    if (!validarFormulario()) return;

    setLoading(true);

    try {
      const productosCliente = state.items.map((item) => ({
        nombre: item.nombre,
        varianteId: item.varianteId || null,
        varianteNombre: item.varianteNombre || "",
        agregados: Array.isArray(item.agregados) ? item.agregados : [],
        cantidad: item.quantity,
        precio_unitario: item.precio ?? item.price ?? 0,
        subtotal: (item.precio ?? item.price ?? 0) * item.quantity,
      }));

      const total = productosCliente.reduce((sum, p) => sum + p.subtotal, 0);

      const localInfo = locales.find((l) => l._id === localId) || null;
      const localNombre = localInfo?.nombre || "";
      const tipoPagoFinal =
        metodoPago === "efectivo" ? tipoPagoEfectivo : metodoPago;
      const detalleCliente = `WEB - ${cliente.nombre} - ${cliente.telefono}`;
      const detalleEfectivo =
        metodoPago === "efectivo" && notaEfectivo.trim()
          ? ` | Nota efectivo: ${notaEfectivo.trim()}`
          : "";

      const res = await api.post("/ventasCliente", {
        productos: productosCliente.map((p) => ({
          ...p,
          observacion: `${detalleCliente} | ${tipoPedido === "delivery" ? `Delivery: ${cliente.direccion || "sin dirección"}` : "Sin delivery"}${detalleEfectivo}`,
        })),
        total,
        tipo_pago: tipoPagoFinal,
        tipo_pedido: tipoPedido,
        hora_retiro: tipoPedido === "retiro" ? horaRetiro : "",
        cliente_email: cliente.correo || user?.email || "sincorreo",
        cliente_nombre: cliente.nombre,
        cliente_direccion: cliente.direccion || "",
        cliente_telefono: cliente.telefono,
        nota_efectivo: metodoPago === "efectivo" ? notaEfectivo.trim() : "",
        local: localId || null,
      });

      if (user?.token && res?.data?._id) {
        dispatch({ type: "CLEAR_CART" });
        navigate(`/compras/detalle/${res.data._id}`);
        return;
      }

      const guestId = `local_${Date.now().toString(36)}`;
      const ordenLocal = {
        _id: guestId,
        backend_id: res?.data?._id || null,
        numero_pedido: res?.data?.numero_pedido || `W${Date.now().toString().slice(-6)}`,
        fecha: res?.data?.fecha || new Date().toISOString(),
        tipo_pago: tipoPagoFinal,
        estado_pedido: res?.data?.estado_pedido || "pendiente",
        hora_retiro: tipoPedido === "retiro" ? horaRetiro : "",
        cliente: {
          ...cliente,
        },
        nota_efectivo: metodoPago === "efectivo" ? notaEfectivo.trim() : "",
        productos: productosCliente,
        total,
        local: localId || null,
        local_nombre: localNombre,
      };

      const prev = JSON.parse(localStorage.getItem("ventas_local") || "[]");
      localStorage.setItem("ventas_local", JSON.stringify([ordenLocal, ...prev]));

      dispatch({ type: "CLEAR_CART" });
      navigate(`/compras/detalle/${guestId}`);
    } catch (err) {
      console.error("Error al guardar venta:", err);
      alert("No se pudo procesar el pedido.");
    } finally {
      setLoading(false);
    }
  };

  const handlePagarConWebpay = async () => {
    if (!validarFormulario(true)) return;

    setLoading(true);

    try {
      const response = await api.post("/pagos/crear-sesion", {
        order: {
          local: localId || null,
          tipo_pedido: tipoPedido,
          hora_retiro: tipoPedido === "retiro" ? horaRetiro : "",
          cliente: {
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            direccion: cliente.direccion || "",
            correo: cliente.correo || user?.email || "",
          },
          items: state.items.map((item) => ({
            productoId: item._id,
            nombre: item.nombre,
            precio: item.precio ?? item.price ?? 0,
            cantidad: item.quantity,
            varianteId: item.varianteId || null,
            varianteNombre: item.varianteNombre || "",
            agregados: Array.isArray(item.agregados) ? item.agregados : [],
          })),
        },
      });

      redirigirAWebpay({
        url: response?.data?.url,
        token: response?.data?.token,
      });
    } catch (error) {
      console.error("Error al crear sesión de pago:", error);
      alert("No se pudo iniciar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Finalizar pedido</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Resumen del carrito</h2>
          {state.items.map((item) => (
            <div
              key={
                item.idCarrito ||
                `${item._id}::${item.varianteId || item.varianteKey || "base"}::${getAgregadosKey(
                  item.agregados
                )}`
              }
              className="flex gap-4 border-b py-3 items-center"
            >
              {item.imagen_url && (
                <img
                  src={item.imagen_url}
                  alt={item.nombre}
                  className="w-16 h-16 object-cover rounded border border-white shadow-sm"
                />
              )}
              <div className="flex-1">
                <span className="block text-sm font-semibold">
                  {item.nombre} x {item.quantity}
                </span>
                {item.varianteNombre && (
                  <span className="block text-xs text-gray-500">
                    Variación: {item.varianteNombre}
                  </span>
                )}
                {Array.isArray(item.agregados) && item.agregados.length > 0 && (
                  <span className="block text-xs text-gray-500">
                    Agregados: {item.agregados.map((agg) => agg.nombre).join(", ")}
                  </span>
                )}
                <span className="block text-sm text-gray-600">
                  ${((item.precio ?? item.price ?? 0) * item.quantity).toLocaleString("es-CL")}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="space-y-4">
            <div>
              <label className="font-medium">Tipo de pedido:</label>
              <select
                value={tipoPedido}
                onChange={(e) => setTipoPedido(e.target.value)}
                className="block w-full border rounded px-3 py-2 mt-1"
              >
                <option value="tienda">Para consumir en tienda</option>
                <option value="retiro">Retiro en tienda</option>
                <option value="delivery">Delivery a domicilio</option>
              </select>
            </div>

            <input type="text" name="nombre" placeholder="Nombre completo" className="w-full border rounded px-3 py-2" onChange={handleInput} />
            <input type="tel" name="telefono" placeholder="Teléfono" className="w-full border rounded px-3 py-2" onChange={handleInput} />
            {tipoPedido === "delivery" && (
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="direccion"
                    placeholder="Dirección"
                    className="w-full border rounded px-3 py-2"
                    value={cliente.direccion}
                    onChange={handleDireccionInput}
                    autoComplete="off"
                    onBlur={() => {
                      setTimeout(() => limpiarSugerenciasDireccion(), 150);
                    }}
                  />
                  <button
                    type="button"
                    onClick={usarUbicacionActual}
                    disabled={geoLoading}
                    className="shrink-0 border rounded px-3 py-2 text-sm bg-white hover:bg-gray-50 disabled:opacity-60"
                    title="Usar mi ubicacion actual"
                  >
                    {geoLoading ? "Ubicando..." : "Mi ubicacion"}
                  </button>
                </div>
                {mapsError && (
                  <p className="text-xs text-amber-600 mt-1">
                    {mapsError}
                  </p>
                )}
                {!GOOGLE_MAPS_API_KEY && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sugerencias de Google Maps no configuradas.
                  </p>
                )}
                {buscandoDireccion && cliente.direccion?.trim().length >= 3 && (
                  <p className="text-xs text-gray-500 mt-1">Buscando direcciones...</p>
                )}
                {geoCoords && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sugerencias cercanas a tu ubicacion actual.
                  </p>
                )}
                {sugerenciasDireccion.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow max-h-56 overflow-auto">
                    {sugerenciasDireccion.map((sug) => (
                      <button
                        key={sug.placeId}
                        type="button"
                        onClick={() => seleccionarSugerenciaDireccion(sug)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                      >
                        {sug.texto}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={placesContainerRef} className="hidden" />
              </div>
            )}
            {tipoPedido === "retiro" && (
              <div>
                <label className="block font-medium mb-1">Hora de retiro:</label>
                <input
                  type="time"
                  value={horaRetiro}
                  onChange={(e) => setHoraRetiro(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {todayScheduleText
                    ? `Horario de hoy: ${todayScheduleText}`
                    : "No hay horario cargado para hoy."}
                </p>
              </div>
            )}
            <input type="email" name="correo" placeholder="Correo electrónico (opcional)" className="w-full border rounded px-3 py-2" onChange={handleInput} />
            <input type="text" name="codigoPostal" placeholder="Código postal (opcional)" className="w-full border rounded px-3 py-2" onChange={handleInput} />

            {hasSchedule && !isOpenNow && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {closedMessage}
              </div>
            )}

            <div>
              <label className="block font-medium mb-1">Método de pago:</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">-- Selecciona --</option>
                <option value="online">Tarjeta (Webpay)</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>

            {metodoPago === "efectivo" && (
              <div>
                <label className="block font-medium mb-1">¿Dónde pagarás?</label>
                {tipoPedido === "delivery" ? (
                  <div className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-700">
                    Al recibir en casa
                  </div>
                ) : (
                  <select
                    value={tipoPagoEfectivo}
                    onChange={(e) => setTipoPagoEfectivo(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">-- Selecciona --</option>
                    <option value="caja">En caja (local)</option>
                  </select>
                )}
              </div>
            )}

            {metodoPago === "efectivo" && tipoPedido === "delivery" && (
              <div>
                <label className="block font-medium mb-1">Nota de pago (opcional)</label>
                <input
                  type="text"
                  value={notaEfectivo}
                  onChange={(e) => setNotaEfectivo(e.target.value)}
                  placeholder="Ej: Pago justo o pago con $20.000 para vuelto"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            )}

            {metodoPago === "online" ? (
              <button
                onClick={handlePagarConWebpay}
                disabled={loading || (hasSchedule && !isOpenNow)}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Redirigiendo a Webpay..." : "Pagar con Webpay 💳"}
              </button>
            ) : (
              <button
                onClick={crearOrden}
                disabled={loading || (hasSchedule && !isOpenNow)}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Confirmar Pedido"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
