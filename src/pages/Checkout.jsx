import { useCart } from "../contexts/cart/CartContext";
import api from "../api";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLocal } from "../contexts/LocalContext";
import { useWebSchedule } from "../contexts/WebScheduleContext";
import { formatOrderAddon, normalizeOrderAddons } from "../utils/orderAddons";
import { normalizeCoordinate, resolveMatchingZone } from "../utils/deliveryZones";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const getDeliveryOptions = (localInfo) => {
  const servicios = localInfo?.servicios || {};
  return [
    {
      value: "tienda",
      label: "Para consumir en tienda",
      enabled: servicios.tienda !== false,
    },
    {
      value: "retiro",
      label: "Retiro en tienda",
      enabled: servicios.retiro !== false,
    },
    {
      value: "delivery",
      label: "Delivery a domicilio",
      enabled: servicios.delivery !== false,
    },
  ].filter((option) => option.enabled);
};

const getPaymentOptions = (localInfo) => {
  const pagos = localInfo?.pagos_web || {};
  return [
    {
      value: "online",
      label: "Tarjeta (Webpay)",
      enabled: pagos.tarjeta !== false,
    },
    {
      value: "efectivo",
      label: "Efectivo",
      enabled: pagos.efectivo !== false,
    },
  ].filter((option) => option.enabled);
};

const Checkout = () => {
  const { state, dispatch } = useCart();
  const { user } = useAuth();
  const { localId, locales, localInfo } = useLocal();
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
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [zoneWarning, setZoneWarning] = useState("");

  const availableDeliveryOptions = getDeliveryOptions(localInfo);
  const availablePaymentOptions = getPaymentOptions(localInfo);
  const hasDeliveryOptions = availableDeliveryOptions.length > 0;
  const hasPaymentOptions = availablePaymentOptions.length > 0;

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
  const mapContainerRef = useRef(null);
  const mapHostRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const debounceDireccionRef = useRef(null);
  const isMountedRef = useRef(true);
  const skipNextAddressLookupRef = useRef(false);

  const handleInput = (e) => {
    setCliente({ ...cliente, [e.target.name]: e.target.value });
  };
  const handleDireccionInput = (e) => {
    const value = e.target.value;
    setCliente((prev) => ({ ...prev, direccion: value }));
    setZoneWarning("");
  };
  const limpiarSugerenciasDireccion = () => {
    if (debounceDireccionRef.current) {
      clearTimeout(debounceDireccionRef.current);
      debounceDireccionRef.current = null;
    }
    setSugerenciasDireccion([]);
    setBuscandoDireccion(false);
  };
  const actualizarDireccionDesdeCoords = (lat, lng, opts = {}) => {
    const nextCoords = normalizeCoordinate({ lat, lng });
    if (nextCoords) {
      setGeoCoords(nextCoords);
    }
    if (!geocoderRef.current) {
      setCliente((prev) => ({
        ...prev,
        direccion: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      }));
      return;
    }

    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      const direccion =
        status === "OK" && Array.isArray(results) && results[0]?.formatted_address
          ? results[0].formatted_address
          : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      skipNextAddressLookupRef.current = true;
      setCliente((prev) => ({ ...prev, direccion }));
      setBuscandoDireccion(true);
      obtenerPrediccionesDireccion(direccion, { coords: nextCoords || { lat, lng } });

      if (opts?.centerMap && mapRef.current) {
        mapRef.current.setCenter({ lat, lng });
      }
    });
  };

  const hasConfiguredDeliveryZones = Array.isArray(localInfo?.delivery_zones)
    && localInfo.delivery_zones.some((zone) => zone?.active !== false && Array.isArray(zone?.polygon) && zone.polygon.length >= 3);
  const matchingZone = tipoPedido === "delivery" ? resolveMatchingZone(localInfo?.delivery_zones || [], geoCoords) : null;
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
    if (!hasDeliveryOptions) {
      if (tipoPedido) setTipoPedido("");
      return;
    }

    const isCurrentEnabled = availableDeliveryOptions.some((option) => option.value === tipoPedido);
    if (!isCurrentEnabled) {
      setTipoPedido(availableDeliveryOptions[0].value);
    }
  }, [availableDeliveryOptions, hasDeliveryOptions, tipoPedido]);

  useEffect(() => {
    if (!hasPaymentOptions) {
      if (metodoPago) setMetodoPago("");
      return;
    }

    const isCurrentEnabled = availablePaymentOptions.some((option) => option.value === metodoPago);
    if (!isCurrentEnabled) {
      setMetodoPago("");
      setTipoPagoEfectivo("");
    }
  }, [availablePaymentOptions, hasPaymentOptions, metodoPago]);

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

    if (skipNextAddressLookupRef.current) {
      skipNextAddressLookupRef.current = false;
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

  useEffect(() => {
    if (tipoPedido !== "delivery" || !mostrarMapa || !mapsReady || !mapContainerRef.current) {
      return;
    }
    if (!window.google?.maps) return;

    const center = geoCoords || { lat: -33.4489, lng: -70.6693 };
    const needsNewMap = !mapRef.current || mapHostRef.current !== mapContainerRef.current;

    if (needsNewMap) {
      mapHostRef.current = mapContainerRef.current;
      mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center,
        zoom: geoCoords ? 17 : 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      markerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapRef.current,
        draggable: true,
      });

      mapRef.current.addListener("click", (e) => {
        const lat = e.latLng?.lat();
        const lng = e.latLng?.lng();
        if (typeof lat !== "number" || typeof lng !== "number") return;
        markerRef.current?.setPosition({ lat, lng });
        actualizarDireccionDesdeCoords(lat, lng);
      });

      markerRef.current.addListener("dragend", (e) => {
        const lat = e.latLng?.lat();
        const lng = e.latLng?.lng();
        if (typeof lat !== "number" || typeof lng !== "number") return;
        actualizarDireccionDesdeCoords(lat, lng);
      });
      return;
    }

    if (markerRef.current) {
      markerRef.current.setPosition(center);
    }
    mapRef.current.setCenter(center);
  }, [tipoPedido, mostrarMapa, mapsReady, geoCoords]);

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
        fields: ["formatted_address", "name", "geometry"],
        sessionToken: sessionTokenRef.current || undefined,
      },
      (place, status) => {
        const placeCoords = normalizeCoordinate({
          lat: place?.geometry?.location?.lat?.(),
          lng: place?.geometry?.location?.lng?.(),
        });
        const finalAddress =
          status === window.google.maps.places.PlacesServiceStatus.OK
            ? place?.formatted_address || place?.name || sugerencia.texto
            : sugerencia.texto;

        skipNextAddressLookupRef.current = true;
        setCliente((prev) => ({ ...prev, direccion: finalAddress || prev.direccion }));
        if (placeCoords) {
          setGeoCoords(placeCoords);
          markerRef.current?.setPosition(placeCoords);
          mapRef.current?.setCenter(placeCoords);
        }
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
              skipNextAddressLookupRef.current = true;
              setCliente((prev) => ({ ...prev, direccion }));
              setBuscandoDireccion(true);
              obtenerPrediccionesDireccion(direccion, { coords: { lat, lng } });
              markerRef.current?.setPosition({ lat, lng });
              mapRef.current?.setCenter({ lat, lng });
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

    if (!hasDeliveryOptions) {
      alert("Este local no tiene tipos de pedido habilitados.");
      return false;
    }

    if (!hasPaymentOptions) {
      alert("Este local no tiene métodos de pago web habilitados.");
      return false;
    }

    if (tipoPedido === "delivery" && !cliente.direccion) {
      alert("Debes ingresar una dirección para delivery.");
      return false;
    }

    if (tipoPedido === "delivery" && hasConfiguredDeliveryZones && !geoCoords) {
      alert("Debes confirmar la ubicacion en el mapa o elegir una sugerencia valida.");
      return false;
    }

    if (tipoPedido === "delivery" && hasConfiguredDeliveryZones && geoCoords && !matchingZone) {
      alert("La ubicacion esta fuera de la zona de reparto de este local.");
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

  const asegurarCoordenadasDelivery = async () => {
    if (tipoPedido !== "delivery") return null;
    if (geoCoords) return geoCoords;
    if (!cliente.direccion?.trim()) return null;
    if (!geocoderRef.current) return null;

    return new Promise((resolve) => {
      geocoderRef.current.geocode({ address: cliente.direccion.trim() }, (results, status) => {
        if (status !== "OK" || !Array.isArray(results) || !results[0]?.geometry?.location) {
          resolve(null);
          return;
        }

        const coords = normalizeCoordinate({
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        });

        if (coords) {
          setGeoCoords(coords);
          markerRef.current?.setPosition(coords);
          mapRef.current?.setCenter(coords);
        }

        resolve(coords);
      });
    });
  };

  const crearOrden = async () => {
    if (!validarFormulario()) return;

    setLoading(true);

    try {
      const confirmedCoords = await asegurarCoordenadasDelivery();
      if (tipoPedido === "delivery" && hasConfiguredDeliveryZones && !confirmedCoords && !geoCoords) {
        alert("Debes confirmar la ubicacion exacta para delivery.");
        setLoading(false);
        return;
      }

      const finalCoords = confirmedCoords || geoCoords || null;
      const finalZone = tipoPedido === "delivery"
        ? resolveMatchingZone(localInfo?.delivery_zones || [], finalCoords)
        : null;

      if (tipoPedido === "delivery" && hasConfiguredDeliveryZones && !finalZone) {
        alert("La ubicacion esta fuera de la zona de reparto de este local.");
        setLoading(false);
        return;
      }

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
        cliente_coords: finalCoords,
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
          coords: finalCoords,
        },
        nota_efectivo: metodoPago === "efectivo" ? notaEfectivo.trim() : "",
        productos: productosCliente,
        total,
        local: localId || null,
        local_nombre: localNombre,
        cliente_coords: finalCoords,
        delivery_zone_name: finalZone?.name || "",
      };

      const prev = JSON.parse(localStorage.getItem("ventas_local") || "[]");
      localStorage.setItem("ventas_local", JSON.stringify([ordenLocal, ...prev]));

      dispatch({ type: "CLEAR_CART" });
      navigate(`/compras/detalle/${guestId}`);
    } catch (err) {
      console.error("Error al guardar venta:", err);
      const backendMsg = err?.response?.data?.msg || err?.response?.data?.error || "";
      alert(backendMsg || "No se pudo procesar el pedido.");
    } finally {
      setLoading(false);
    }
  };

  const handlePagarConWebpay = async () => {
    if (!validarFormulario(true)) return;

    setLoading(true);

    try {
      const confirmedCoords = await asegurarCoordenadasDelivery();
      if (tipoPedido === "delivery" && hasConfiguredDeliveryZones && !confirmedCoords && !geoCoords) {
        alert("Debes confirmar la ubicacion exacta para delivery.");
        setLoading(false);
        return;
      }

      const finalCoords = confirmedCoords || geoCoords || null;
      const finalZone = tipoPedido === "delivery"
        ? resolveMatchingZone(localInfo?.delivery_zones || [], finalCoords)
        : null;

      if (tipoPedido === "delivery" && hasConfiguredDeliveryZones && !finalZone) {
        alert("La ubicacion esta fuera de la zona de reparto de este local.");
        setLoading(false);
        return;
      }

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
            coords: finalCoords,
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
      const backendMsg =
        error?.response?.data?.error || error?.response?.data?.msg || "";
      alert(backendMsg || "No se pudo iniciar el pago.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tipoPedido !== "delivery") {
      setZoneWarning("");
      return;
    }

    if (!hasConfiguredDeliveryZones) {
      setZoneWarning("");
      return;
    }

    if (!geoCoords) {
      setZoneWarning("Este local valida delivery por zona. Debes confirmar la ubicacion exacta.");
      return;
    }

    if (!matchingZone) {
      setZoneWarning("Tu ubicacion esta fuera de la zona de reparto de este local.");
      return;
    }

    setZoneWarning(`Cobertura disponible en: ${matchingZone.name}`);
  }, [tipoPedido, hasConfiguredDeliveryZones, geoCoords, matchingZone]);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Finalizar pedido</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Resumen del carrito</h2>
          {state.items.map((item) => {
            const agregados = normalizeOrderAddons(item.agregados);
            return (
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
                {agregados.length > 0 && (
                  <span className="block text-xs text-gray-500">
                    Agregados: {agregados.map((agg) => formatOrderAddon(agg)).join(", ")}
                  </span>
                )}
                <span className="block text-sm text-gray-600">
                  ${((item.precio ?? item.price ?? 0) * item.quantity).toLocaleString("es-CL")}
                </span>
              </div>
            </div>
            );
          })}
        </div>

        <div>
          <div className="space-y-4">
            <div>
              <label className="font-medium">Tipo de pedido:</label>
              {availableDeliveryOptions.length === 1 ? (
                <div className="block w-full border rounded px-3 py-2 mt-1 bg-gray-50 text-gray-700">
                  {availableDeliveryOptions[0].label}
                </div>
              ) : (
                <select
                  value={tipoPedido}
                  onChange={(e) => setTipoPedido(e.target.value)}
                  className="block w-full border rounded px-3 py-2 mt-1"
                >
                  {availableDeliveryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {!hasDeliveryOptions && (
                <p className="text-xs text-red-600 mt-1">
                  Este local no tiene tipos de pedido habilitados.
                </p>
              )}
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
                  {mapsReady && (
                    <button
                      type="button"
                      onClick={() => setMostrarMapa((prev) => !prev)}
                      className="shrink-0 border rounded px-3 py-2 text-sm bg-white hover:bg-gray-50"
                      title="Elegir en mapa"
                    >
                      {mostrarMapa ? "Ocultar mapa" : "Ver mapa"}
                    </button>
                  )}
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
                {zoneWarning && (
                  <p
                    className={`text-xs mt-1 ${
                      matchingZone ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {zoneWarning}
                  </p>
                )}
                {mostrarMapa && mapsReady && (
                  <div className="mt-2">
                    <div className="rounded border overflow-hidden h-56">
                      <div ref={mapContainerRef} className="w-full h-full" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Haz clic en el mapa o mueve el marcador para ajustar la dirección.
                    </p>
                  </div>
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
              {availablePaymentOptions.length === 1 ? (
                <div className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-700">
                  {availablePaymentOptions[0].label}
                </div>
              ) : (
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Selecciona --</option>
                  {availablePaymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {!hasPaymentOptions && (
                <p className="text-xs text-red-600 mt-1">
                  Este local no tiene métodos de pago web habilitados.
                </p>
              )}
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
