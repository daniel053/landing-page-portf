import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "./fx.css";

/* Efeitos de vidro e 3D. ?fx=off mostra o site sem eles, para comparar. */
if (new URLSearchParams(window.location.search).get("fx") !== "off") {
  document.documentElement.classList.add("fx");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
