import { CATEGORIES } from "../lib/categories";
import { supabase } from "../lib/supabase";

interface Props {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  userEmail: string;
}

export default function CategoryNav({ selectedCategory, onSelectCategory, userEmail }: Props) {
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Categories</span>
      </div>
      <div className="sidebar-list">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`sidebar-item ${selectedCategory === cat.id ? "active" : ""}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <span className="sidebar-dot">●</span>
            <span className="sidebar-name">{cat.label}</span>
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="sidebar-user-email" title={userEmail}>{userEmail}</div>
        <button className="sidebar-logout-btn" onClick={handleLogout}>Sign Out</button>
      </div>
    </nav>
  );
}
