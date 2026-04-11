"use client";

import { createContext, useContext, useReducer } from "react";

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const existing = state.find((item) => item.product === action.item.product);
      if (existing) {
        return state.map((item) =>
          item.product === action.item.product
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...state, { ...action.item, quantity: 1 }];
    }
    case "REMOVE":
      return state.filter((item) => item.product !== action.product);
    case "INCREMENT":
      return state.map((item) =>
        item.product === action.product
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    case "DECREMENT":
      return state
        .map((item) =>
          item.product === action.product
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0);
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, []);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.amount * item.quantity,
    0
  );

  function addItem(item) {
    dispatch({ type: "ADD", item });
  }

  function removeItem(product) {
    dispatch({ type: "REMOVE", product });
  }

  function increment(product) {
    dispatch({ type: "INCREMENT", product });
  }

  function decrement(product) {
    dispatch({ type: "DECREMENT", product });
  }

  function clear() {
    dispatch({ type: "CLEAR" });
  }

  return (
    <CartContext.Provider
      value={{ items, totalCount, totalAmount, addItem, removeItem, increment, decrement, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
