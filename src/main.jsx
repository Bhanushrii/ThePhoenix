import React from "react";
import "./index.css";  // Ensure global styles are applied

import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes"; // Import Dark Theme
import App from "./App.jsx";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  <ClerkProvider
    appearance={{ baseTheme: dark }}
    publishableKey={clerkPubKey}
    afterSignInUrl="/dashboard"
    afterSignUpUrl="/dashboard"
    routing="history"  // Uses history mode for smoother transitions
  >
    <App />
  </ClerkProvider>
);
