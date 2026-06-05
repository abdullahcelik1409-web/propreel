"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" toastOptions={{ style: { background: "#111", color: "#fff", border: "1px solid rgba(255,255,255,.1)" } }} />
    </SessionProvider>
  );
}
