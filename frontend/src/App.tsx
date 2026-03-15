import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";
import LoginPage from "./components/LoginPage";
import CategoryNav from "./components/CategoryNav";
import ProductList from "./components/ProductList";
import ProductPage from "./components/ProductPage";
import RunningJobBanner from "./components/RunningJobBanner";

type View = "home" | "product";

interface ProductRef {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface RunningJob {
  productId: string;
  productName: string;
  type: "discovery" | "analysis";
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<View>("home");
  const [selectedCategory, setSelectedCategory] = useState("revenue-cycle-management");
  const [selectedProduct, setSelectedProduct] = useState<ProductRef | null>(null);
  const [productListRefresh, setProductListRefresh] = useState(0);
  const [runningJobs, setRunningJobs] = useState<RunningJob[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  function openProduct(product: ProductRef) {
    setSelectedProduct(product);
    setView("product");
  }

  function goHome() {
    setView("home");
    setSelectedProduct(null);
  }

  function handleCategorySelect(cat: string) {
    setSelectedCategory(cat);
    setView("home");
    setSelectedProduct(null);
  }

  function handleJobStart(productId: string, productName: string, type: "discovery" | "analysis") {
    setRunningJobs(prev => {
      const filtered = prev.filter(j => j.productId !== productId);
      return [...filtered, { productId, productName, type }];
    });
  }

  function handleJobEnd(productId: string) {
    setRunningJobs(prev => prev.filter(j => j.productId !== productId));
    setProductListRefresh(n => n + 1);
  }

  function handleProductUpdated(id: string, name: string, description: string) {
    if (selectedProduct?.id === id) {
      setSelectedProduct(prev => prev ? { ...prev, name, description } : prev);
    }
    setProductListRefresh(n => n + 1);
  }

  function handleProductDeleted(id: string) {
    handleJobEnd(id);
    setProductListRefresh(n => n + 1);
  }

  function goToProduct(productId: string) {
    // If the job's product is already selected, just switch to it
    if (selectedProduct?.id === productId) {
      setView("product");
    }
    // Otherwise we'd need the full product info — just navigate home so user can click it
    // This is a graceful fallback; the banner is most useful when staying on the same product page
  }

  if (authLoading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        color: "var(--gray-500)",
        gap: "0.75rem",
      }}>
        <div className="spinner" />
        Loading…
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="app-layout">
      <CategoryNav
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        userEmail={session.user.email ?? ""}
      />
      <div className="app-main">
        <RunningJobBanner jobs={runningJobs} onGoToProduct={goToProduct} />
        {view === "home" && (
          <ProductList
            category={selectedCategory}
            refresh={productListRefresh}
            onOpenProduct={openProduct}
            onProductCreated={() => setProductListRefresh(n => n + 1)}
          />
        )}
        {view === "product" && selectedProduct && (
          <ProductPage
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            productDescription={selectedProduct.description}
            onBack={goHome}
            onJobStart={handleJobStart}
            onJobEnd={handleJobEnd}
            onProductUpdated={handleProductUpdated}
            onProductDeleted={handleProductDeleted}
          />
        )}
      </div>
    </div>
  );
}
