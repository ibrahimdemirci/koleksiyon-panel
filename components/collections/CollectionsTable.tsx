import Link from "next/link";

interface CollectionItem {
  id: string;
  info?: {
    name?: string;
  };
  salesChannelId?: string | number;
}

interface CollectionsTableProps {
  collections: CollectionItem[];
}

export function CollectionsTable({ collections }: CollectionsTableProps) {
  if (!collections.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-12 text-center text-slate-500 backdrop-blur">
        Henüz koleksiyon bulunmuyor.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-lg shadow-slate-900/10 backdrop-blur">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-gradient-to-r from-indigo-50 to-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500/80">
          <tr>
            <th scope="col" className="px-6 py-4">
              Adı
            </th>
            <th scope="col" className="px-6 py-4">
              ID
            </th>
            <th scope="col" className="px-6 py-4">
              Satış Kanalı
            </th>
            <th scope="col" className="px-6 py-4 text-right">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white/60">
          {collections.map((collection) => (
            <tr key={collection.id}>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">
                    {collection.info?.name ?? "İsimsiz"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {collection.salesChannelId
                      ? `Satış Kanalı ${collection.salesChannelId}`
                      : "Satış kanalı tanımlı değil"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-5 text-sm font-medium text-slate-600">
                {collection.id}
              </td>
              <td className="px-6 py-5 text-sm text-slate-600">
                {collection.salesChannelId ?? "-"}
              </td>
              <td className="px-6 py-5 text-right">
                <Link
                  href={`/collections/${collection.id}/edit`}
                  className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
                >
                  Sabitleri Düzenle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

