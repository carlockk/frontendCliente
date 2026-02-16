import { createContext, useReducer, useContext, useEffect } from "react";

const CartContext = createContext();

const initialState = {
  items: [],
  total: 0,
};

const getAgregadosKey = (agregados = []) => {
  if (!Array.isArray(agregados) || agregados.length === 0) return "sin-agregados";
  return agregados
    .map((agg) => String(agg?.agregadoId || agg?._id || agg?.nombre || ""))
    .filter(Boolean)
    .sort()
    .join("|") || "sin-agregados";
};

const getCartItemId = (item) =>
  item.idCarrito ||
  `${item._id}::${item.varianteId || item.varianteKey || "base"}::${getAgregadosKey(item.agregados)}`;

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM": {
      const cantidad = action.payload.cantidad || 1;
      const idCarrito =
        action.payload.idCarrito ||
        `${action.payload._id}::${
          action.payload.varianteId || action.payload.varianteKey || "base"
        }::${getAgregadosKey(action.payload.agregados)}`;
      const precio = action.payload.precio ?? action.payload.price ?? 0;
      const existing = state.items.find(
        (item) => getCartItemId(item) === idCarrito
      );
      let updatedItems;

      if (existing) {
        updatedItems = state.items.map((item) =>
          getCartItemId(item) === idCarrito
            ? { ...item, idCarrito, quantity: item.quantity + cantidad }
            : item
        );
      } else {
        updatedItems = [
          ...state.items,
          { ...action.payload, idCarrito, quantity: cantidad },
        ];
      }

      const newTotal = updatedItems.reduce(
        (acc, item) => acc + (item.precio ?? item.price ?? 0) * item.quantity,
        0
      );

      return {
        items: updatedItems,
        total: newTotal,
      };
    }

    case "REMOVE_ITEM": {
      const updatedItems = state.items.filter(
        (item) => getCartItemId(item) !== action.payload
      );
      const newTotal = updatedItems.reduce(
        (acc, item) => acc + (item.precio ?? item.price ?? 0) * item.quantity,
        0
      );
      return { items: updatedItems, total: newTotal };
    }

    case "INCREMENT_ITEM": {
      const updatedItems = state.items.map((item) =>
        getCartItemId(item) === action.payload
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      const newTotal = updatedItems.reduce(
        (acc, item) => acc + (item.precio ?? item.price ?? 0) * item.quantity,
        0
      );
      return { items: updatedItems, total: newTotal };
    }

    case "DECREMENT_ITEM": {
      const updatedItems = state.items
        .map((item) =>
          getCartItemId(item) === action.payload && item.quantity > 1
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0);
      const newTotal = updatedItems.reduce(
        (acc, item) => acc + (item.precio ?? item.price ?? 0) * item.quantity,
        0
      );
      return { items: updatedItems, total: newTotal };
    }

    case "CLEAR_CART":
      return { items: [], total: 0 };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const storedCart = localStorage.getItem("cart");
  const [state, dispatch] = useReducer(
    cartReducer,
    storedCart ? JSON.parse(storedCart) : initialState
  );

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(state));
  }, [state]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
