import { Suspense } from "react";
import ExoplanetCatalog from "./ExoplanetCatalog";

export const metadata = { title: "Exoplanet Catalog — Orrery Extension" };

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ExoplanetCatalogPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <ExoplanetCatalog />
      </div>
    </div>
  );
}