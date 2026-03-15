import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { CATEGORIES } from "../lib/categories";
import ProductCard from "./ProductCard";
import AddProductModal from "./AddProductModal";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  created_at: string;
  competitor_discoveries?: { status: string; updated_at: string }[];
  analyses?: { status: string; updated_at: string }[];
}

interface Props {
  category: string;
  refresh: number;
  onOpenProduct: (product: { id: string; name: string; category: string; description: string }) => void;
  onProductCreated: () => void;
}

export default function ProductList({ category, refresh, onOpenProduct, onProductCreated }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const categoryLabel = CATEGORIES.find(c => c.id === category)?.label ?? category;

  useEffect(() => {
    setLoading(true);
    setFetchError("");
    apiFetch("/products")
      .then(async r => {
        const body = await r.json();
        if (!r.ok || body.error) throw new Error(body.error ?? `Server error ${r.status}`);
        setProducts((body.data ?? []).filter((p: Product) => p.category === category));
      })
      .catch(err => setFetchError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [category, refresh]);

  function handleProductCreated(_product: Product) {
    setShowAddModal(false);
    onProductCreated();
  }

  return (
    <div className="product-list-page">
      <div className="product-list-header">
        <div>
          <h2 className="product-list-title">{categoryLabel}</h2>
          <p className="product-list-subtitle">
            {loading ? "Loading…" : products.length === 0
              ? "No products yet"
              : `${products.length} product${products.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          className="btn-primary product-add-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add Product
        </button>
      </div>

      {fetchError && (
        <div className="status-bar error" style={{ marginBottom: "1rem" }}>
          Could not load products: {fetchError}
        </div>
      )}

      {loading ? (
        <div className="product-list-loading">
          <div className="spinner" style={{ borderColor: "var(--gray-400)", borderTopColor: "transparent" }} />
        </div>
      ) : products.length === 0 && !fetchError ? (
        <div className="product-list-empty">
          <p>No products in this category yet.</p>
          <p>Click <strong>+ Add Product</strong> to get started.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={() => onOpenProduct(p)}
              analysisUpdatedAt={p.analyses?.[0]?.updated_at ?? null}
              discoveryStatus={p.competitor_discoveries?.[0]?.status ?? null}
              analysisStatus={p.analyses?.[0]?.status ?? null}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddProductModal
          category={category}
          onCreated={handleProductCreated}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
