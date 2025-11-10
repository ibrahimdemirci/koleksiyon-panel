 "use client";

import { create } from "zustand";

export interface MaestroFilterOption {
  filterId: string;
  value: string;
  label: string;
  comparisonType?: number;
  fieldId?: string;
}

export interface MaestroFilter {
  id: string;
  title: string;
  options?: MaestroFilterOption[];
}

interface EditState {
  products: unknown[];
  filters: MaestroFilter[];
  selectedFilters: MaestroFilterOption[];
  setProducts: (products: unknown[]) => void;
  setFilters: (filters: MaestroFilter[]) => void;
  setSelectedFilters: (selectedFilters: MaestroFilterOption[]) => void;
}

export const useEditStore = create<EditState>((set) => ({
  products: [],
  filters: [],
  selectedFilters: [],
  setProducts: (products) => set({ products }),
  setFilters: (filters) => set({ filters }),
  setSelectedFilters: (selectedFilters) => set({ selectedFilters }),
}));

