import { CATEGORIES } from "../lib/categories";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface Props {
  product: Product;
  onClick: () => void;
  analysisUpdatedAt?: string | null;
  discoveryStatus?: string | null;
  analysisStatus?: string | null;
}

export default function ProductCard({ product, onClick, analysisUpdatedAt, discoveryStatus, analysisStatus }: Props) {
  const categoryLabel = CATEGORIES.find(c => c.id === product.category)?.label ?? product.category;
  const isRunning = discoveryStatus === "running" || analysisStatus === "running";

  return (
    <div
      className="product-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}
    >
      <div className="product-card-top-row">
        <div className="product-card-category">{categoryLabel}</div>
        {isRunning && (
          <span className="product-card-running-badge">
            <span className="spinner product-card-spinner" />
            Running
          </span>
        )}
      </div>
      <h3 className="product-card-name">{product.name}</h3>
      <p className="product-card-desc">{product.description}</p>
      <div className="product-card-footer">
        <span className="product-card-arrow">View Analysis →</span>
        {analysisUpdatedAt && !isRunning && (
          <span className="product-card-timestamp">
            Updated {new Date(analysisUpdatedAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric"
            })}
          </span>
        )}
      </div>
    </div>
  );
}
