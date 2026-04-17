import React from "react";
import {
  IconTag, IconMapPin, IconUsers, IconDollarSign,
  IconFileText, IconClock, IconX, IconResource,
} from "../common/Icons";
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

function ImageGallery({ images }) {
  const [active, setActive] = React.useState(0);
  return (
    <div style={{ marginBottom: 0 }}>
      {/* Main image */}
      <div style={{ width:"100%", height:200, overflow:"hidden", borderRadius:"16px 16px 0 0", position:"relative" }}>
        <img src={images[active]} alt="resource" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        {images.length > 1 && (
          <>
            <button onClick={() => setActive(a => (a - 1 + images.length) % images.length)}
              style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", background:"rgba(0,0,0,0.45)", border:"none", color:"#fff", borderRadius:"50%", width:28, height:28, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <button onClick={() => setActive(a => (a + 1) % images.length)}
              style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"rgba(0,0,0,0.45)", border:"none", color:"#fff", borderRadius:"50%", width:28, height:28, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </>
        )}
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display:"flex", gap:6, padding:"8px 0 0", justifyContent:"center" }}>
          {images.map((src, i) => (
            <div key={i} onClick={() => setActive(i)}
              style={{ width:44, height:44, borderRadius:6, overflow:"hidden", cursor:"pointer", border:`2px solid ${i===active?"#4f6fff":"#e2e8f0"}`, flexShrink:0, transition:"border-color 0.15s" }}>
              <img src={src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResourceDetailModal({ resource, onClose, onBook, canBook = false }) {
  const { brands } = useBrands();
  if (!resource) return null;
  const brandInfo = brands.find(b => b.name === resource.brand);

  const isActive  = resource.status === "ACTIVE";
  const typeColor = TYPE_COLORS[resource.type] || "#4f6fff";
  const symbol    = CURRENCIES[resource.currency] || "Rs";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
     <div
  onClick={e => e.stopPropagation()}
  style={{
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    maxWidth: 540,
    width: "100%",
    maxHeight: "90vh",     
    overflowY: "auto",      
    boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
    position: "relative",
   
  }}
>
        {/* Top accent */}
        <div style={{ height: 4, background: `linear-gradient(90deg,${typeColor},${typeColor}66)` }}/>

        <div style={{ padding: "24px 28px 28px" }}>
          {/* Image gallery */}
        {resource.images && resource.images.length > 0 && (
          <ImageGallery images={resource.images} />
        )}

        {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                background: `${typeColor}12`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <IconResource size={28} color={typeColor}/>
              </div>
              <div>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" }}>
                  {resource.name}
                </h2>
                <div style={{ fontSize: 11, fontWeight: 700, color: typeColor, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>
                  {resource.type?.replace(/_/g, " ")}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "#f1f5f9", border: "none", color: "#64748b",
                width: 34, height: 34, borderRadius: 9, cursor: "pointer",
                fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
            >
              <IconX size={16}/>
            </button>
          </div>

          {/* Status */}
          <div style={{ marginBottom: 20 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: isActive ? "#f0fdf4" : "#fef2f2",
              color: isActive ? "#059669" : "#dc2626",
              border: `1px solid ${isActive ? "#bbf7d0" : "#fecaca"}`,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? "#059669" : "#dc2626", display: "inline-block" }}/>
              {isActive ? "Available" : "Out of Service"}
            </span>
          </div>

          {/* Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Brand",     value: resource.brand,    Icon: IconTag },
              { label: "Location",  value: resource.location, Icon: IconMapPin },
              { label: "Capacity",  value: resource.capacity ? `${resource.capacity} people` : "N/A", Icon: IconUsers },
              { label: "Price/Hour",value: resource.pricePerHour > 0 ? `${symbol} ${Number(resource.pricePerHour).toLocaleString()}` : "Free", Icon: IconDollarSign },
            ].map(({ label, value, Icon }) => (
              <div key={label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5, display:"flex", alignItems:"center", gap:5 }}>
                  <Icon size={12} style={{ color:"#94a3b8", flexShrink:0 }}/> {label}
                </div>
                <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Brand details */}
          {brandInfo && (
            <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
                <IconTag size={12} style={{ color:"#94a3b8" }}/> Brand Info
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom: brandInfo.description||brandInfo.contact ? 4 : 0 }}>{brandInfo.name}</div>
              {brandInfo.description && <div style={{ fontSize:12, color:"#475569", marginBottom: brandInfo.contact ? 4 : 0 }}>{brandInfo.description}</div>}
              {brandInfo.contact && <div style={{ fontSize:12, color:"#4f6fff", fontWeight:600 }}>{brandInfo.contact}</div>}
              {!brandInfo.description && !brandInfo.contact && (
                <div style={{ fontSize:12, color:"#94a3b8" }}>No additional details available</div>
              )}
            </div>
          )}

          {/* Description */}
          {resource.description && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8, display:"flex", alignItems:"center", gap:5 }}>
                <IconFileText size={12} style={{ color:"#94a3b8" }}/> Description
              </div>
              <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{resource.description}</p>
            </div>
          )}

          {/* Availability Windows */}
          {resource.availabilityWindows?.length > 0 && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10, display:"flex", alignItems:"center", gap:5 }}>
                <IconClock size={12} style={{ color:"#94a3b8" }}/> Availability Windows
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {resource.availabilityWindows.map((w, i) => (
                  <span key={i} style={{
                    padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: `${typeColor}12`, color: typeColor,
                    border: `1px solid ${typeColor}30`,
                  }}>
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              width: "100%", marginTop: 20, padding: "12px",
              background: "linear-gradient(135deg,#4f6fff,#00e5c3)",
              border: "none", borderRadius: 10, color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", boxShadow: "0 4px 12px rgba(79,111,255,0.2)",
            }}
          >
            Close
          </button>
          {canBook && resource.status === "ACTIVE" && (
            <button
              onClick={() => onBook?.(resource.id)}
              style={{
                width: "100%", marginTop: 10, padding: "12px",
                background: "#0f172a",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Book This Resource
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
