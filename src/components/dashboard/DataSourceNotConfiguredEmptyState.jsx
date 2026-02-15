"use client";

import { Database } from "lucide-react";

export default function DataSourceNotConfiguredEmptyState({ layerLabel = "This layer", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/80 p-8 sm:p-10 text-center ${className}`}
      role="status"
    >
      <Database className="w-12 h-12 text-amber-600 mb-4" aria-hidden />
      <h3 className="text-lg font-bold text-slate-800 mb-2">Data Source Not Configured</h3>
      <p className="text-sm text-slate-600 max-w-md">
        {layerLabel} is not connected. Go to <strong>Database Settings</strong> to select Local DB or connect an external provider.
      </p>
    </div>
  );
}
