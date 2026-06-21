"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      toastOptions={{
        style: { background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#f5f5f5" },
      }}
    />
  );
}
