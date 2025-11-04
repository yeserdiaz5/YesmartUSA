import React from "react";
import ComprasClient from "./compras-client";

export default function ComprasPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Mis Compras</h1>
      <ComprasClient />
    </main>
  );
}
