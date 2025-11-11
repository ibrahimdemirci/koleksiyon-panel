"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { ReactElement } from "react";
import { FilterPanel } from "@/components/edit/FilterPanel";
import { DraggableList } from "@/components/edit/DraggableList";
import { SaveModal } from "@/components/edit/SaveModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  type MaestroFilter,
  type MaestroFilterOption,
  useEditStore,
} from "@/lib/store";

const DEFAULT_PRODUCTS_BODY = {
  additionalFilters: [] as unknown[],
  page: 1,
  pageSize: 36,
};

type MaestroProduct = Record<string, unknown>;
type RawFilter = Record<string, unknown>;

interface EditWorkspaceProps {
  collectionId: string;
  initialFilters: unknown;
  initialAvailableProducts: MaestroProduct[];
  initialConstants: MaestroProduct[];
  collectionInfo?: {
    id?: number | string;
    name?: string;
    totalProducts?: number;
  };
}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const pickString = (
  record: Record<string, unknown>,
  keys: string[],
  fallback?: string,
): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number") {
      return value.toString();
    }
  }
  return fallback;
};

const pickNumber = (
  record: Record<string, unknown>,
  keys: string[],
  fallback = 0,
): number => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return fallback;
};

function normalizeFilters(data: unknown): MaestroFilter[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return (data as RawFilter[]).map((item, index) => {
    const filterRecord = asRecord(item);
    const filterId =
      pickString(filterRecord, ["id", "code", "key"]) ?? index.toString();

    const rawOptions =
      filterRecord["options"] ??
      filterRecord["values"] ??
      filterRecord["items"] ??
      filterRecord["children"] ??
      filterRecord["list"] ??
      [];

    const optionsSource = Array.isArray(rawOptions)
      ? (rawOptions as unknown[])
      : [];

    const options: MaestroFilterOption[] = optionsSource
      .map((option, optionIndex) => {
        const optionRecord = asRecord(option);
        const value =
          pickString(optionRecord, ["value", "id", "code", "key"]) ??
          optionIndex.toString();

        if (value === undefined) {
          return null;
        }

        return {
          filterId,
          value,
          label:
            pickString(optionRecord, ["label", "name", "title", "displayName"]) ??
            value,
          comparisonType: pickNumber(
            optionRecord,
            ["comparisonType", "comparison"],
            pickNumber(filterRecord, ["comparisonType"]),
          ),
          fieldId:
            pickString(optionRecord, ["fieldId"]) ??
            pickString(filterRecord, ["fieldId"]),
        };
      })
      .filter(Boolean) as MaestroFilterOption[];

    return {
      id: filterId,
      title:
        pickString(filterRecord, ["title", "name", "label", "displayName"]) ??
        `Filtre ${index + 1}`,
      options,
    };
  });
}

export function EditWorkspace({
  collectionId,
  initialFilters,
  initialAvailableProducts,
  initialConstants,
  collectionInfo,
}: EditWorkspaceProps) {
  const products = useEditStore((state) => state.products);
  const filters = useEditStore((state) => state.filters);
  const selectedFilters = useEditStore((state) => state.selectedFilters);
  const setProducts = useEditStore((state) => state.setProducts);
  const setFilters = useEditStore((state) => state.setFilters);
  const setSelectedFilters = useEditStore((state) => state.setSelectedFilters);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPayload, setModalPayload] = useState<Record<string, unknown>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [availableProductsState, setAvailableProductsState] =
    useState<MaestroProduct[]>(
      Array.isArray(initialAvailableProducts) ? initialAvailableProducts : [],
    );

  const normalizedFilters = useMemo(
    () => normalizeFilters(initialFilters),
    [initialFilters],
  );

  useEffect(() => {
    const store = useEditStore.getState();
    const nextConstants = Array.isArray(initialConstants)
      ? initialConstants
      : [];

    if (store.filters !== normalizedFilters) {
      setFilters(normalizedFilters);
    }

    if (store.products !== nextConstants) {
      setProducts(nextConstants);
    }

    if (store.selectedFilters.length > 0) {
      setSelectedFilters([]);
    }
  }, [
    normalizedFilters,
    initialConstants,
    setFilters,
    setProducts,
    setSelectedFilters,
  ]);

  useEffect(() => {
    const initialList = Array.isArray(initialAvailableProducts)
      ? initialAvailableProducts
      : [];
    const constantsList = Array.isArray(initialConstants)
      ? initialConstants
      : [];

    setAvailableProductsState(mergeProductsByCode(initialList, constantsList));
  }, [initialAvailableProducts, initialConstants]);

  const effectiveFilters = filters.length ? filters : normalizedFilters;

  const constants: MaestroProduct[] =
    products.length > 0 ? (products as MaestroProduct[]) : initialConstants;

  const availableProducts = useMemo(
    () =>
      Array.isArray(availableProductsState) ? availableProductsState : [],
    [availableProductsState],
  );

  const filteredAvailableProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableProducts;
    }

    const query = searchQuery.trim().toLowerCase();

    return availableProducts.filter((product) => {
      const productRecord = asRecord(product);
      const title =
        pickString(productRecord, [
          "name",
          "title",
          "productName",
          "displayName",
        ]) ?? "";
      const code = getProductCode(productRecord) ?? "";

      return (
        title.toLowerCase().includes(query) ||
        code.toLowerCase().includes(query)
      );
    });
  }, [availableProducts, searchQuery]);

  const constantsLimit = 9;

  const handleFiltersChange = (nextSelected: MaestroFilterOption[]) => {
    setSelectedFilters(nextSelected);
    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch(
          `/api/collections/${collectionId}/products`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...DEFAULT_PRODUCTS_BODY,
              additionalFilters: nextSelected.map((filter) => ({
                id: filter.filterId,
                value: filter.value,
                comparisonType: filter.comparisonType ?? 0,
                fieldId: filter.fieldId,
              })),
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Ürünler getirilirken hata oluştu.");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Geçersiz ürün verisi alındı.");
        }

        setAvailableProductsState(
          mergeProductsByCode(
            Array.isArray(data) ? data : [],
            constants,
          ),
        );
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Beklenmeyen bir hata oluştu.");
      }
    });
  };

  const handleReorder = (nextProducts: MaestroProduct[]) => {
    setProducts(nextProducts);
  };

  const handleSave = () => {
    const payload = {
      collectionId,
      additionalFilters: selectedFilters.map((filter) => ({
        id: filter.filterId,
        value: filter.value,
        comparisonType: filter.comparisonType ?? 0,
        fieldId: filter.fieldId,
      })),
      products: constants.map((product, index) => ({
        order: index + 1,
        productId:
          getProductCode(asRecord(product)) ?? `product-${index}`,
        name:
          pickString(asRecord(product), [
            "name",
            "title",
            "productName",
            "displayName",
          ]) ?? undefined,
        raw: {
          ...asRecord(product),
          order: index + 1,
        },
      })),
    };

    setModalPayload(payload);
    setIsModalOpen(true);
  };

  const productCount = constants.length;

  const handleClearFilters = () => {
    setSearchQuery("");
    setAvailableProductsState(
      mergeProductsByCode(
        Array.isArray(initialAvailableProducts) ? initialAvailableProducts : [],
        Array.isArray(initialConstants) ? initialConstants : [],
      ),
    );
    handleFiltersChange([]);
  };

  const handleFilterModalClose = () => setIsFilterModalOpen(false);

  const handleCancel = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  const getProductCode = (record: Record<string, unknown>) =>
    pickString(record, [
      "productCode",
      "productId",
      "sku",
      "code",
      "id",
    ]);

  const mergeProductsByCode = (
    base: MaestroProduct[],
    extras: MaestroProduct[],
  ) => {
    const seen = new Set<string>();
    const combined: MaestroProduct[] = [];

    const append = (items: MaestroProduct[]) => {
      for (const item of items) {
        const code = getProductCode(asRecord(item));
        const key = code ?? JSON.stringify(item);
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      }
    };

    append(base);
    append(extras);

    return combined;
  };

  const pickImage = (record: Record<string, unknown>) =>
    pickString(record, [
      "image",
      "imageUrl",
      "thumbnail",
      "thumbnailUrl",
      "cover",
      "picture",
      "image_path",
      "productImage",
    ]);

  const renderProductMedia = (
    imageUrl: string | undefined,
    alt: string,
  ): ReactElement => {
    if (imageUrl) {
      return (
        <div className="relative h-40 w-full overflow-hidden rounded-xl bg-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={alt}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      );
    }

    return (
      <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
        >
          <path
            d="M5 5H19C20.1 5 21 5.9 21 7V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7C3 5.9 3.9 5 5 5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 15L8 10L13 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 13L15 10L21 16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 8.5C9.32843 8.5 10 7.82843 10 7C10 6.17157 9.32843 5.5 8.5 5.5C7.67157 5.5 7 6.17157 7 7C7 7.82843 7.67157 8.5 8.5 8.5Z"
            fill="currentColor"
          />
        </svg>
      </div>
    );
  };

  const renderAvailableCard = (product: MaestroProduct, index: number) => {
    const productRecord = asRecord(product);
    const title =
      pickString(productRecord, [
        "name",
        "title",
        "productName",
        "displayName",
      ]) ?? "Ürün";
    const code = getProductCode(productRecord) ?? `code-${index}`;
    const imageUrl = pickImage(productRecord);

    const isSelected = constants.some((item) => {
      const record = asRecord(item);
      const itemCode = getProductCode(record) ?? "";
      return itemCode === code;
    });

    return (
      <article
        key={code}
        className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm shadow-slate-900/10 transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        {isSelected ? (
          <span className="absolute left-4 top-4 rounded-full bg-slate-900/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-md shadow-slate-900/40">
            Eklendi
          </span>
        ) : null}
        {renderProductMedia(imageUrl, title)}
        <div className="flex flex-col gap-1">
          <span
            className="text-sm font-semibold text-slate-900 leading-snug"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            title={title}
          >
            {title}
          </span>
          <span className="text-xs font-medium text-slate-500">{code}</span>
        </div>
      </article>
    );
  };

  const renderConstantCard = (product: MaestroProduct, index: number) => {
    const productRecord = asRecord(product);
    const title =
      pickString(productRecord, [
        "name",
        "title",
        "productName",
        "displayName",
      ]) ?? "Ürün";
    const code = getProductCode(productRecord) ?? `code-${index}`;
    const imageUrl = pickImage(productRecord);

    return (
      <article className="group flex h-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-md shadow-slate-900/10 ring-1 ring-transparent transition hover:-translate-y-0.5 hover:shadow-xl hover:ring-indigo-200">
        {renderProductMedia(imageUrl, title)}
        <div className="flex flex-col gap-1">
          <span
            className="text-sm font-semibold text-slate-900 leading-snug"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            title={title}
          >
            {title}
          </span>
          <span className="text-xs font-medium text-slate-500">{code}</span>
        </div>
      </article>
    );
  };

  const placeholders = Math.max(0, constantsLimit - productCount);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl shadow-slate-900/10 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              Koleksiyon Sabitlerini Düzenle
            </span>
            <h2 className="text-2xl font-semibold text-slate-900">
              {collectionInfo?.name ?? `Koleksiyon - ${collectionId}`}
            </h2>
            <p className="text-xs text-slate-500">
              {availableProducts.length} ürün listeleniyor. Sabit alanında{" "}
              {productCount} ürün var; kartları sürükleyerek sıralamayı
              güncelleyebilirsiniz.
            </p>
          </div>
          {isPending ? (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-600">
              Ürünler yükleniyor...
            </span>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Ürün adı veya kodu ile arayın"
              className="w-full rounded-2xl border border-slate-200/70 bg-white/95 px-5 py-3 text-sm text-slate-700 shadow-inner shadow-slate-900/5 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
            />
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-[0.3em] text-slate-300">
              Ara
            </span>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsFilterModalOpen(true)}
            className="min-w-[140px]"
          >
            Filtreler
          </Button>
        </div>
        {selectedFilters.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {selectedFilters.map((filter) => (
              <button
                key={`${filter.filterId}-${filter.value}`}
                type="button"
                onClick={() =>
                  handleFiltersChange(
                    selectedFilters.filter(
                      (item) =>
                        !(
                          item.filterId === filter.filterId &&
                          item.value === filter.value
                        ),
                    ),
                  )
                }
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-slate-900/20 transition hover:bg-slate-800"
              >
                {filter.label}
                <span aria-hidden>×</span>
              </button>
            ))}
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:text-slate-900"
            >
              Seçimi temizle
            </button>
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-3xl border border-rose-200/80 bg-rose-50/80 px-6 py-4 text-sm text-rose-700 shadow-sm shadow-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex h-full flex-col gap-5 rounded-3xl border border-white/60 bg-white/85 p-6 shadow-lg shadow-slate-900/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Koleksiyon Ürünleri
              </h3>
              <p className="text-xs text-slate-500">
                {filteredAvailableProducts.length} ürün listeleniyor
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-500">
              {productCount} sabit
            </div>
          </div>
          <div className="max-h-[540px] overflow-hidden rounded-2xl border border-slate-200/70 bg-white/60">
            <div className="grid max-h-[540px] grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAvailableProducts.map((product, index) =>
                renderAvailableCard(product, index),
              )}
            </div>
          </div>
        </section>

        <section className="flex h-full flex-col gap-5 rounded-3xl border border-white/60 bg-white/85 p-6 shadow-lg shadow-slate-900/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Sabitler</h3>
              <p className="text-xs text-slate-500">
                Kartları sürükleyerek sıralamayı güncelleyin.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 p-1 text-xs font-semibold text-slate-500">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-full px-3 py-1 transition ${
                  viewMode === "grid"
                    ? "bg-slate-900 text-white shadow-sm shadow-slate-900/20"
                    : "hover:bg-slate-100"
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-full px-3 py-1 transition ${
                  viewMode === "list"
                    ? "bg-slate-900 text-white shadow-sm shadow-slate-900/20"
                    : "hover:bg-slate-100"
                }`}
              >
                Liste
              </button>
            </div>
          </div>
          {productCount === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 text-sm text-slate-500">
              Henüz sabit eklenmedi.
            </div>
          ) : (
            <DraggableList
              items={constants}
              onReorder={handleReorder}
              containerClassName={
                viewMode === "grid"
                  ? "grid gap-4 md:grid-cols-2"
                  : "flex flex-col gap-3"
              }
              renderItem={(product, index) =>
                renderConstantCard(product, index)
              }
            />
          )}
          {viewMode === "grid" && placeholders > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: placeholders }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-xs font-medium uppercase tracking-[0.3em] text-slate-400"
                >
                  <span>Boş Slot</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={handleCancel}>
          Vazgeç
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Kaydet
        </Button>
      </div>

      <Modal
        title="Filtreleri Uygula"
        isOpen={isFilterModalOpen}
        onClose={handleFilterModalClose}
        footer={
          <>
            <Button variant="secondary" onClick={handleClearFilters}>
              Seçimi Temizle
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleFilterModalClose();
              }}
            >
              Ara
            </Button>
          </>
        }
      >
        <FilterPanel
          filters={effectiveFilters}
          selectedFilters={selectedFilters}
          onChange={handleFiltersChange}
          variant="modal"
        />
      </Modal>
      <SaveModal
        isOpen={isModalOpen}
        payload={modalPayload}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

