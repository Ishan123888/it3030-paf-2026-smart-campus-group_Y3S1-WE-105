import React from "react";
import { useBrands } from "../../hooks/useBrands";

const TYPE_ICONS = {
  LECTURE_HALL: "🏛️", LAB: "🔬", MEETING_ROOM: "🤝",
  PROJECTOR: "📽️", CAMERA: "📷", LAPTOP: "💻",
  MICROPHONE: "🎤", SMART_BOARD: "📋", WATER_FILTER: "💧",
  CHAIR: "🪑", TABLE: "🪵", AC: "❄️",
};

const TYPE_COLORS = {
  LECTURE_HALL: "#4f6fff", LAB: "#7c3aed", MEETING_ROOM: "#0891b2",
  PROJECTOR: "#d97706", CAMERA: "#dc2626", LAPTOP: "#059669",
  MICROPHONE: "#db2777", SMART_BOARD: "#0891b2", WATER_FILTER: "#0284c7",
  CHAIR: "#64748b", TABLE: "#64748b", AC: "#0891b2",
};

const CURRENCIES = { LKR: "Rs", USD: "$" };

export default function ResourceCard({ resource, onClick }) {
  const { brands } = useBrands();
  const brandInfo = brands.find(b => b.name === resource.brand);
  const isActive   = resource.status === "ACTIVE";
  const icon       = TYPE_ICONS[resource.type] || "📦";
  const typeColor  = TYPE_COLORS[resource.type] || "#4f6fff";
  const symbol     = CURRENCIES[resource.currency] || "Rs";

  return (
    <div
      onClick={onClick}
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 20,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
      onMouseEnter={e => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)";
        e.currentTarget.style.borderColor = typeColor + "66";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
    >
      {/* Top accent bar */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${typeColor},${typeColor}88)`, borderRadius:"16px 16px 0 0" }}/>

      {/* Status badge */}
      <span style={{
        position: "absolute", top: 16, right: 14,
        padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
        background: isActive ? "#f0fdf4" : "#fef2f2",
        color: isActive ? "#059669" : "#dc2626",
        border: `1px solid ${isActive ? "#bbf7d0" : "#fecaca"}`,
        textTransform: "uppercase", letterSpacing: "0.4px",
      }}>
        {isActive ? "Active" : "Out of Service"}
      </span>

      {/* Image or Icon */}
      {resource.images && resource.images.length > 0 ? (
        <div style={{ width:"100%", height:120, borderRadius:10, overflow:"hidden", marginBottom:14, marginTop:6, flexShrink:0 }}>
          <img src={resource.images[0]} alt={resource.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        </div>
      ) : (
        <div style={{
          width: 48, height: 48, borderRadius: 12, marginBottom: 14, marginTop: 6,
          background: `${typeColor}12`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>
          {icon}
        </div>
      )}

      {/* Name + Type */}
      <h3 style={{ margin: "0 0 4px", color: "#0f172a", fontSize: 15, fontWeight: 700, paddingRight: 80, lineHeight: 1.3 }}>
        {resource.name}
      </h3>
      <div style={{ fontSize: 11, fontWeight: 700, color: typeColor, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
        {resource.type?.replace(/_/g, " ")}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#f1f5f9", marginBottom: 12 }}/>

      {/* Meta */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <MetaRow label="Brand" value={resource.brand} color={typeColor} />
        {brandInfo && (brandInfo.description || brandInfo.contact) && (
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:-4, paddingLeft:2 }}>
            {[brandInfo.description, brandInfo.contact].filter(Boolean).join(" · ")}
          </div>
        )}
        <MetaRow label="Location" value={resource.location} />
        {resource.capacity > 0 && (
          <MetaRow label="Capacity" value={`${resource.capacity} people`} />
        )}
        {resource.pricePerHour > 0 && (
          <MetaRow label="Price" value={`${symbol} ${Number(resource.pricePerHour).toLocaleString()} / hr`} />
        )}
      </div>

      {/* Click hint */}
      {onClick && (
        <div style={{ marginTop: 14, fontSize: 12, color: typeColor, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          View details
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: color || "#475569", fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </span>
    </div>
  );
}
