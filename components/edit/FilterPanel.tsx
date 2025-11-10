"use client";

import * as React from "react";
import type {
  MaestroFilter,
  MaestroFilterOption,
} from "@/lib/store";

interface FilterPanelProps {
  filters: MaestroFilter[];
  selectedFilters: MaestroFilterOption[];
  onChange: (selected: MaestroFilterOption[]) => void;
  variant?: "panel" | "modal";
}

export function FilterPanel({
  filters,
  selectedFilters,
  onChange,
  variant = "panel",
}: FilterPanelProps) {
  const isModal = variant === "modal";

  const handleSelect = (filter: MaestroFilter, optionId: string) => {
    const existing = selectedFilters.filter(
      (item) => item.filterId !== filter.id,
    );

    if (!optionId) {
      onChange(existing);
      return;
    }

    const option = filter.options?.find((item) => item.value === optionId);

    if (!option) {
      onChange(existing);
      return;
    }

    onChange([...existing, option]);
  };

  const containerClasses = isModal
    ? "flex flex-col gap-6"
    : "flex flex-col gap-5 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-slate-900/10 backdrop-blur";

  const gridClasses = isModal
    ? "grid gap-3 md:grid-cols-2"
    : "flex flex-col gap-3";

  const labelClasses = isModal
    ? "flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm shadow-slate-900/5"
    : "flex flex-col gap-2 rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-sm shadow-slate-900/5";

  const heading = isModal ? (
    <div className="space-y-1.5">
      <h2 className="text-sm font-semibold text-slate-900">Filtreler</h2>
      <p className="text-xs text-slate-500">
        Koleksiyon ürünlerini daraltmak için kriter seçin.
      </p>
    </div>
  ) : (
    <div className="space-y-1.5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
        Filtreler
      </h2>
      <p className="text-sm text-slate-600">
        Ürünleri filtreleyerek istediğiniz sabitleri seçin.
      </p>
    </div>
  );

  return (
    <div className={containerClasses}>
      {heading}
      <div className={gridClasses}>
        {filters.map((filter) => {
          const selected = selectedFilters.find(
            (item) => item.filterId === filter.id,
          );
          const options = filter.options ?? [];

          return (
            <label key={filter.id} className={labelClasses}>
              <span className="text-sm font-semibold text-slate-700">
                {filter.title}
              </span>
              <select
                value={selected?.value ?? ""}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                onChange={(event) => handleSelect(filter, event.target.value)}
              >
                <option value="">Tümü</option>
                {options.map((option, optionIndex) => {
                  const key = `${filter.id}-${option.value}-${optionIndex}`;
                  return (
                    <option key={key} value={option.value}>
                      {option.label}
                    </option>
                  );
                })}
              </select>
            </label>
          );
        })}
      </div>
      {selectedFilters.length > 0 ? (
        <div
          className={
            isModal
              ? "flex flex-wrap gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4"
              : "flex flex-wrap gap-2"
          }
        >
          {selectedFilters.map((selected) => (
            <button
              key={`${selected.filterId}-${selected.value}`}
              type="button"
              onClick={() =>
                onChange(
                  selectedFilters.filter(
                    (item) =>
                      !(
                        item.filterId === selected.filterId &&
                        item.value === selected.value
                      ),
                  ),
                )
              }
              className="inline-flex items-center gap-1 rounded-full bg-indigo-100/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm shadow-indigo-500/10 transition hover:bg-indigo-200/80"
            >
              {selected.label}
              <span aria-hidden className="text-indigo-400">
                ×
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

