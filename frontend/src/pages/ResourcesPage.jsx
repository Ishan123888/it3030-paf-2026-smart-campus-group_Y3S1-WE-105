import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getResources } from "../api/api";
import ResourceCard from "../components/resources/ResourceCard";
import ResourceDetailModal from "../components/resources/ResourceDetailModal";
import { useAuth } from "../context/AuthContext";

const RESOURCE_TYPES = [
  "LECTURE_HALL", "LAB", "MEETING_ROOM",
  "PROJECTOR", "CAMERA", "LAPTOP", "MICROPHONE", "SMART_BOARD",
  "WATER_FILTER", "CHAIR", "TABLE", "AC",
];

const BRANDS = ["Brand 1", "Brand 2", "Brand 3"];

export default function ResourcesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [filters, setFilters]     = useState({
    search: "", type: "", brand: "", location: "", minCapacity: "", status: "",
  });

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search)      params.search      = filters.search;
      if (filters.type)        params.type        = filters.type;
      if (filters.brand)       params.brand       = filters.brand;
      if (filters.location)    params.location    = filters.location;
      if (filters.minCapacity) params.minCapacity = filters.minCapacity;
      if (filters.status)      params.status      = filters.status;
      const res = await getResources(params);
      setResources(res.data);
    } catch (err) {
      console.error("Failed to load resources", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(fetchResources, 300);
    return () => clearTimeout(t);
  }, [fetchResources]);

  const setFilter   = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const clearFilters = () => setFilters({ search:"", type:"", brand:"", location:"", minCapacity:"", status:"" });
  const hasFilters  = Object.values(filters).some(v => v !== "");

  const activeCount = resources.filter(r => r.status === "ACTIVE").length;
  const oosCount    = resources.filter(r => r.status === "OUT_OF_SERVICE").length;

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* ── Hero Header ── */}
        <div style={s.hero}>
          <div style={s.heroText}>
            <div style={s.heroEyebrow}>SmartCampus</div>
            <h1 style={s.heroTitle}>Campus Resources</h1>
            <p style={s.heroSub}>Browse and discover available facilities and equipment across campus</p>
          </div>
          <div style={s.heroStats}>
            <div style={s.statPill}>
              <span style={{ ...s.statDot, background: "#059669" }} />
              <span style={s.statNum}>{activeCount}</span>
              <span style={s.statLabel}>Available</span>
            </div>
            <div style={s.statPill}>
              <span style={{ ...s.statDot, background: "#dc2626" }} />
              <span style={s.statNum}>{oosCount}</span>
              <span style={s.statLabel}>Out of Service</span>
            </div>
            <div style={s.statPill}>
              <span style={{ ...s.statDot, background: "#4f6fff" }} />
              <span style={s.statNum}>{resources.length}</span>
              <span style={s.statLabel}>Total</span>
            </div>
          </div>
        </div>

        {/* ── Search + Filters ── */}
        <div style={s.filterCard}>
          {/* Search */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <svg style={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, type, location..."
              value={filters.search}
              onChange={e => setFilter("search", e.target.value)}
              style={s.searchInput}
              onFocus={e => e.target.style.borderColor = '#4f6fff'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Filter row */}
          <div style={s.filterRow}>
            <select value={filters.type} onChange={e => setFilter("type", e.target.value)} style={s.select}>
              <option value="">All Types</option>
              {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>

            <select value={filters.brand} onChange={e => setFilter("brand", e.target.value)} style={s.select}>
              <option value="">All Brands</option>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={e => setFilter("location", e.target.value)}
              style={s.select}
              onFocus={e => e.target.style.borderColor = '#4f6fff'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />

            <input
              type="number"
              placeholder="Min Capacity"
              value={filters.minCapacity}
              onChange={e => setFilter("minCapacity", e.target.value)}
              style={s.select}
              min={1}
              onFocus={e => e.target.style.borderColor = '#4f6fff'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />

            <select value={filters.status} onChange={e => setFilter("status", e.target.value)} style={s.select}>
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>

            {hasFilters && (
              <button onClick={clearFilters} style={s.clearBtn}>
                ✕ Clear
              </button>
            )}
          </div>

          {/* Result count */}
          <div style={s.resultCount}>
            {loading
              ? "Loading resources..."
              : `${resources.length} resource${resources.length !== 1 ? "s" : ""} found`
            }
            {hasFilters && !loading && (
              <span style={s.filterBadge}>Filtered</span>
            )}
          </div>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <LoadingGrid />
        ) : resources.length === 0 ? (
          <EmptyState onClear={hasFilters ? clearFilters : null} />
        ) : (
          <div style={s.grid}>
            {resources.map(r => (
              <ResourceCard key={r.id} resource={r} onClick={() => setSelected(r)} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ResourceDetailModal
          resource={selected}
          onClose={() => setSelected(null)}
          canBook={!!user}
          onBook={(selectedResourceId) => navigate(`/dashboard/bookings/new/${selectedResourceId}`)}
        />
      )}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ background:"#f1f5f9", borderRadius:14, height:200, animation:"pulse 1.5s ease-in-out infinite" }}/>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
    </div>
  );
}

function EmptyState({ onClear }) {
  return (
    <div style={{ textAlign:"center", padding:"80px 20px", background:"#fff", borderRadius:16, border:"1px solid #e2e8f0" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:32 }}>🔍</div>
      <h3 style={{ fontSize:18, fontWeight:700, color:"#0f172a", margin:"0 0 8px" }}>No resources found</h3>
      <p style={{ color:"#64748b", margin:"0 0 24px", fontSize:14 }}>Try adjusting your search or filters</p>
      {onClear && (
        <button onClick={onClear} style={{ background:"linear-gradient(135deg,#4f6fff,#00e5c3)", border:"none", borderRadius:9, color:"#fff", padding:"10px 24px", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"inherit" }}>
          Clear Filters
        </button>
      )}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "32px 20px 60px",
  },
  // Hero
  hero: {
    background: "linear-gradient(135deg,#4f6fff 0%,#00e5c3 100%)",
    borderRadius: 20,
    padding: "36px 40px",
    marginBottom: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
    boxShadow: "0 8px 32px rgba(79,111,255,0.2)",
  },
  heroText: {},
  heroEyebrow: {
    fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
  },
  heroTitle: {
    fontSize: 30, fontWeight: 800, color: "#fff",
    margin: "0 0 8px", letterSpacing: "-0.5px",
  },
  heroSub: {
    fontSize: 14, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.5,
  },
  heroStats: {
    display: "flex", gap: 10, flexWrap: "wrap",
  },
  statPill: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 12, padding: "10px 16px",
  },
  statDot: {
    width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0,
  },
  statNum: { fontSize: 18, fontWeight: 800, color: "#fff" },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 500 },
  // Filter card
  filterCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: "20px 24px",
    marginBottom: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  searchIcon: {
    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
    width: 16, height: 16, color: "#94a3b8", pointerEvents: "none",
  },
  searchInput: {
    width: "100%", padding: "12px 16px 12px 38px",
    fontSize: 14, border: "2px solid #e2e8f0", borderRadius: 10,
    outline: "none", fontFamily: "inherit", color: "#0f172a",
    background: "#f8fafc", boxSizing: "border-box", transition: "border-color 0.15s",
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
    marginBottom: 14,
  },
  select: {
    width: "100%", padding: "9px 12px", fontSize: 13,
    border: "2px solid #e2e8f0", borderRadius: 8, outline: "none",
    fontFamily: "inherit", color: "#0f172a", background: "#f8fafc",
    cursor: "pointer", boxSizing: "border-box", transition: "border-color 0.15s",
  },
  clearBtn: {
    padding: "9px 14px", borderRadius: 8, border: "1px solid #fecaca",
    background: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
  },
  resultCount: {
    fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 8,
  },
  filterBadge: {
    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
    background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
};
