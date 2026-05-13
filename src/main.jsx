import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import App from "./App.jsx";
import "./styles.css";

import { registerSW } from "virtual:pwa-register";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const updateSW = registerSW({
  onNeedRefresh() {
    console.log("New content available, click on reload button to update.");
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
