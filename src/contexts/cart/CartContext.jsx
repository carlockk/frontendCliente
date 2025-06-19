import { createContext, useReducer, useContext, useEffect } from "react";

const CartContext = createContext();

const initialState = {
  items: [],
  total: 0,
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(item => item._id === action.payload._id);
      let updatedItems;

      if (existing) {
        updatedItems = state.items.map(item =>
          item._id === action.payload._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedItems = [...state.items, { ...action.payload, quantity: 1 }];
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
      const updatedItems = state.items.filter(item => item._id !== action.payload);
      const newTotal = updatedItems.reduce(
        (acc, item) => acc + (item.precio ?? item.price ?? 0) * item.quantity,
        0
      );

      return {
        items: updatedItems,
        total: newTotal,
      };
    }

    case "INCREMENT_ITEM": {
      const updatedItems = state.items.map(item =>
        item._id === action.payload
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
        .map(item =>
          item._id === action.payload && item.quantity > 1
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
