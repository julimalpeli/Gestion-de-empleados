import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress ResizeObserver warnings
const resizeObserverErrorHandler = (e: ErrorEvent) => {
  if (
    e.message ===
    "ResizeObserver loop completed with undelivered notifications."
  ) {
    e.stopImmediatePropagation();
  }
};

window.addEventListener("error", resizeObserverErrorHandler);

createRoot(document.getElementById("root")!).render(<App />);
