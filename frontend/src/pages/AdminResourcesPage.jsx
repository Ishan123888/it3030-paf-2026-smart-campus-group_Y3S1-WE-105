import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, flexRender,
} from "@tanstack/react-table";
import { getResources, createResource, updateResource, toggleResourceStatus, deleteResource } from "../api/api";
import AdminLayout from "../components/admin/AdminLayout";
import {
  IconPlus, IconSearch, IconFilter, IconEdit, IconTrash,
  IconToggleLeft, IconToggleRight, IconChevronLeft, IconChevronRight,
} from "../components/common/Icons";

const RESOURCE_TYPES = ["LECTURE_HALL","LAB","MEETING_ROOM","PROJECTOR","CAMERA","LAPTOP","MICROPHONE","SMART_BOARD","WATER_FILTER","CHAIR","TABLE","AC"];
const BRANDS = ["Brand 1","Brand 2","Brand 3"];
const EMPTY_FORM = { name:"", type:"LECTURE_HALL", brand:"Brand 1", location:"", capacity:1, description:"", pricePerHour:0, currency:"LKR", availabilityWindows:"", status:"ACTIVE" };

const CURRENCIES = [
  { code: "LKR", symbol: "Rs", label: "LKR" },
  { code: "USD", symbol: "$",  label: "USD" },
];

const formatPrice = (price, currency) => {
  const c = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  return `${c.symbol}${Number(price || 0).toLocaleString()}`;
};

const inputStyle = { background:"#f8fafc", border:"2px solid #e2e8f0", borderRadius:8, padding:"9px 12px", color:"#0f172a", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box", transition:"border-color 0.15s" };
const labelStyle = { color:"#475569", fontSize:11, fontWeight:700, marginBottom:5, display:"block", textTransform:"uppercase", letterSpacing:"0.05em" };

const useIsMobile = () => {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mobile;
};

export default function AdminResourcesPage() {
  const isMobile = useIsMobile();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Table filters
  const [globalFilter, setGlobalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getResources({});
      setResources(res.data);
    } catch { showToast("Failed to load resources", false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtered data before passing to table
  const filteredData = useMemo(() => {
    return resources.filter(r => {
      const matchType = !typeFilter || r.type === typeFilter;
      const matchStatus = !statusFilter || r.status === statusFilter;
      return matchType && matchStatus;
    });
  }, [resources, typeFilter, statusFilter]);

  // Table columns
  const columns = useMemo(() => [
    {
      header: "#",
      id: "index",
      size: 50,
      cell: ({ row }) => (
        <span style={{ color:"#94a3b8", fontSize:12, fontWeight:600 }}>{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Resource Name",
      cell: ({ getValue, row }) => (
        <div>
          <div style={{ fontWeight:700, color:"#0f172a", fontSize:14 }}>{getValue()}</div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{row.original.location}</div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => (
        <span style={{ background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>
          {getValue()?.replace(/_/g," ")}
        </span>
      ),
    },
    {
      accessorKey: "brand",
      header: "Brand",
      cell: ({ getValue }) => <span style={{ color:"#475569", fontSize:13 }}>{getValue()}</span>,
    },
    {
      accessorKey: "capacity",
      header: "Capacity",
      size: 90,
      cell: ({ getValue }) => (
        <span style={{ color:"#475569", fontSize:13, fontWeight:600 }}>{getValue()}</span>
      ),
    },
    {
      accessorKey: "pricePerHour",
      header: "Price/hr",
      size: 110,
      cell: ({ getValue, row }) => (
        <span style={{ color:"#0f172a", fontSize:13, fontWeight:600 }}>
          {formatPrice(getValue(), row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 110,
      cell: ({ getValue }) => {
        const active = getValue() === "ACTIVE";
        return (
          <span style={{ background: active?"#f0fdf4":"#fef2f2", color: active?"#059669":"#dc2626", border:`1px solid ${active?"#bbf7d0":"#fecaca"}`, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, display:"inline-flex", alignItems:"center", gap:5 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background: active?"#059669":"#dc2626", display:"inline-block" }}/>
            {active ? "Active" : "Out of Service"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 140,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div style={{ display:"flex", gap:6 }}>
            <TblBtn onClick={()=>openEdit(r)} color="#4f6fff" title="Edit">
              <IconEdit size={14}/>
            </TblBtn>
            <TblBtn onClick={()=>handleToggleStatus(r)} color={r.status==="ACTIVE"?"#f59e0b":"#059669"} title={r.status==="ACTIVE"?"Disable":"Enable"}>
              {r.status==="ACTIVE" ? <IconToggleLeft size={14}/> : <IconToggleRight size={14}/>}
            </TblBtn>
            <TblBtn onClick={()=>setDeleteConfirm(r)} color="#dc2626" title="Delete">
              <IconTrash size={14}/>
            </TblBtn>
          </div>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (r) => {
    setEditTarget(r);
    setForm({ name:r.name, type:r.type, brand:r.brand, location:r.location, capacity:r.capacity, description:r.description||"", pricePerHour:r.pricePerHour||0, currency:r.currency||"LKR", availabilityWindows:(r.availabilityWindows||[]).join(", "), status:r.status });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, capacity:Number(form.capacity), pricePerHour:Number(form.pricePerHour), availabilityWindows: form.availabilityWindows ? form.availabilityWindows.split(",").map(s=>s.trim()).filter(Boolean) : [] };
      if (editTarget) { await updateResource(editTarget.id, payload); showToast("Resource updated"); }
      else { await createResource(payload); showToast("Resource created"); }
      setShowForm(false); load();
    } catch (err) { showToast(err.response?.data?.message || "Save failed", false); }
    finally { setSaving(false); }
  };

  const handleToggleStatus = async (r) => {
    try { await toggleResourceStatus(r.id); showToast("Status updated"); load(); }
    catch { showToast("Failed to toggle status", false); }
  };

  const handleDelete = async (id) => {
    try { await deleteResource(id); showToast("Resource deleted"); setDeleteConfirm(null); load(); }
    catch { showToast("Delete failed", false); }
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const stats = { total: resources.length, active: resources.filter(r=>r.status==="ACTIVE").length, oos: resources.filter(r=>r.status==="OUT_OF_SERVICE").length };

  return (
    <AdminLayout title="Resource Management">
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:72, right:24, zIndex:999, padding:"12px 20px", borderRadius:10, fontWeight:600, fontSize:14, background: toast.ok?"#f0fdf4":"#fef2f2", border:`1px solid ${toast.ok?"#bbf7d0":"#fecaca"}`, color: toast.ok?"#15803d":"#dc2626", boxShadow:"0 4px 20px rgba(0,0,0,0.1)", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>{toast.ok?"✓":"✗"}</span> {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h2 style={{ margin:"0 0 4px", color:"#0f172a", fontSize:20, fontWeight:800 }}>Campus Resources</h2>
          <p style={{ color:"#64748b", margin:0, fontSize:14 }}>Manage all campus facilities and equipment</p>
        </div>
        <button onClick={openCreate} style={{ background:"linear-gradient(135deg,#4f6fff,#00e5c3)", border:"none", borderRadius:10, color:"#fff", padding:"10px 18px", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"inherit", boxShadow:"0 4px 12px rgba(79,111,255,0.25)", display:"flex", alignItems:"center", gap:8 }}>
          <IconPlus size={16}/> Add Resource
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Total Resources", value:stats.total, color:"#4f6fff", bg:"#eff6ff", border:"#bfdbfe" },
          { label:"Active", value:stats.active, color:"#059669", bg:"#f0fdf4", border:"#bbf7d0" },
          { label:"Out of Service", value:stats.oos, color:"#dc2626", bg:"#fef2f2", border:"#fecaca" },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ color:"#64748b", fontSize:12, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
        {/* Toolbar */}
        <div style={{ display:"flex", gap:8, padding:"14px 16px", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap", alignItems:"center" }}>
          {/* Global search */}
          <div style={{ position:"relative", flex: isMobile ? "1 1 100%" : "1 1 220px" }}>
            <IconSearch size={15} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", pointerEvents:"none" }}/>
            <input
              value={globalFilter ?? ""}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search resources..."
              style={{ ...inputStyle, paddingLeft:32, background:"#f8fafc" }}
            />
          </div>

          {/* Type filter */}
          <div style={{ position:"relative", flex: isMobile ? "1 1 calc(50% - 4px)" : "0 0 160px" }}>
            <IconFilter size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", pointerEvents:"none" }}/>
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ ...inputStyle, paddingLeft:30, background:"#f8fafc" }}>
              <option value="">All Types</option>
              {RESOURCE_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ ...inputStyle, flex: isMobile ? "1 1 calc(50% - 4px)" : "0 0 140px", background:"#f8fafc" }}>
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>

          {/* Clear + count row */}
          <div style={{ display:"flex", alignItems:"center", gap:8, flex: isMobile ? "1 1 100%" : "0 0 auto", justifyContent:"space-between" }}>
            {(globalFilter || typeFilter || statusFilter) && (
              <button onClick={() => { setGlobalFilter(""); setTypeFilter(""); setStatusFilter(""); }} style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #fecaca", background:"#fef2f2", color:"#dc2626", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                Clear filters
              </button>
            )}
            <div style={{ fontSize:12, color:"#94a3b8", whiteSpace:"nowrap", marginLeft:"auto" }}>
              {table.getFilteredRowModel().rows.length} of {resources.length}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding:60, textAlign:"center", color:"#64748b" }}>
            <div style={{ width:32, height:32, border:"3px solid #e2e8f0", borderTop:"3px solid #4f6fff", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Loading resources...
          </div>
        ) : isMobile ? (
          /* ── Mobile Card View ── */
          <div style={{ padding:"12px 16px 16px" }}>
            {table.getRowModel().rows.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:"#94a3b8" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📦</div>
                <div style={{ fontWeight:600, color:"#475569" }}>No resources found</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {table.getRowModel().rows.map(row => {
                  const r = row.original;
                  const active = r.status === "ACTIVE";
                  return (
                    <div key={r.id} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, color:"#0f172a", fontSize:15, marginBottom:2 }}>{r.name}</div>
                          <div style={{ fontSize:12, color:"#94a3b8" }}>{r.location}</div>
                        </div>
                        <span style={{ background: active?"#f0fdf4":"#fef2f2", color: active?"#059669":"#dc2626", border:`1px solid ${active?"#bbf7d0":"#fecaca"}`, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0, marginLeft:8 }}>
                          {active ? "Active" : "Out of Service"}
                        </span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 12px", marginBottom:12 }}>
                        <div><span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>TYPE</span><div style={{ fontSize:12, color:"#475569", fontWeight:600, marginTop:2 }}>{r.type?.replace(/_/g," ")}</div></div>
                        <div><span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>BRAND</span><div style={{ fontSize:12, color:"#475569", marginTop:2 }}>{r.brand}</div></div>
                        <div><span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>CAPACITY</span><div style={{ fontSize:12, color:"#475569", marginTop:2 }}>{r.capacity}</div></div>
                        <div><span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>PRICE/HR</span><div style={{ fontSize:12, color:"#475569", marginTop:2 }}>{formatPrice(r.pricePerHour, r.currency)}</div></div>
                      </div>
                      <div style={{ display:"flex", gap:8, borderTop:"1px solid #f1f5f9", paddingTop:10 }}>
                        <TblBtn onClick={()=>openEdit(r)} color="#4f6fff" title="Edit"><IconEdit size={14}/></TblBtn>
                        <TblBtn onClick={()=>handleToggleStatus(r)} color={active?"#f59e0b":"#059669"} title={active?"Disable":"Enable"}>
                          {active ? <IconToggleLeft size={14}/> : <IconToggleRight size={14}/>}
                        </TblBtn>
                        <TblBtn onClick={()=>setDeleteConfirm(r)} color="#dc2626" title="Delete"><IconTrash size={14}/></TblBtn>
                        <span style={{ marginLeft:"auto", fontSize:11, color:"#94a3b8", alignSelf:"center" }}>#{row.index + 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── Desktop Table View ── */
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id} style={{ background:"#f8fafc", borderBottom:"2px solid #e2e8f0" }}>
                    {hg.headers.map(header => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", cursor: header.column.getCanSort() ? "pointer" : "default", userSelect:"none", whiteSpace:"nowrap", width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      >
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc" && " ↑"}
                          {header.column.getIsSorted() === "desc" && " ↓"}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>
                      <div style={{ fontSize:32, marginBottom:8 }}>📦</div>
                      <div style={{ fontWeight:600, color:"#475569" }}>No resources found</div>
                      <div style={{ fontSize:13, marginTop:4 }}>Try adjusting your filters or add a new resource</div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, idx) => (
                    <tr key={row.id} style={{ borderBottom:"1px solid #f1f5f9", background: idx%2===0?"#ffffff":"#fafafa", transition:"background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background="#f0f7ff"}
                      onMouseLeave={e => e.currentTarget.style.background = idx%2===0?"#ffffff":"#fafafa"}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} style={{ padding:"12px 16px", verticalAlign:"middle" }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && table.getPageCount() > 1 && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderTop:"1px solid #f1f5f9", flexWrap:"wrap", gap:10 }}>
            <div style={{ fontSize:13, color:"#64748b" }}>
              Page <strong style={{ color:"#0f172a" }}>{table.getState().pagination.pageIndex + 1}</strong> of <strong style={{ color:"#0f172a" }}>{table.getPageCount()}</strong>
              <span style={{ marginLeft:8, color:"#94a3b8" }}>({table.getFilteredRowModel().rows.length} results)</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <PagBtn onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} title="First">«</PagBtn>
              <PagBtn onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <IconChevronLeft size={14}/>
              </PagBtn>
              {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                const page = Math.max(0, Math.min(table.getState().pagination.pageIndex - 2, table.getPageCount() - 5)) + i;
                return (
                  <PagBtn key={page} onClick={() => table.setPageIndex(page)} active={table.getState().pagination.pageIndex === page}>
                    {page + 1}
                  </PagBtn>
                );
              })}
              <PagBtn onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <IconChevronRight size={14}/>
              </PagBtn>
              <PagBtn onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} title="Last">»</PagBtn>
            </div>
            <select value={table.getState().pagination.pageSize} onChange={e => table.setPageSize(Number(e.target.value))} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", color:"#0f172a", fontSize:13, cursor:"pointer", outline:"none", fontFamily:"inherit" }}>
              {[5,10,20,50].map(s => <option key={s} value={s}>Show {s}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <h2 style={{ margin:"0 0 24px", color:"#0f172a", fontSize:18, fontWeight:800 }}>{editTarget ? "Edit Resource" : "New Resource"}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Resource Name *</label>
                <input required value={form.name} onChange={e=>setField("name",e.target.value)} placeholder="e.g. Lab A101" style={inputStyle}/>
              </div>
              <div><label style={labelStyle}>Type *</label>
                <select required value={form.type} onChange={e=>setField("type",e.target.value)} style={inputStyle}>
                  {RESOURCE_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Brand *</label>
                <select required value={form.brand} onChange={e=>setField("brand",e.target.value)} style={inputStyle}>
                  {BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Location *</label>
                <input required value={form.location} onChange={e=>setField("location",e.target.value)} placeholder="e.g. Block A, Floor 2" style={inputStyle}/>
              </div>
              <div><label style={labelStyle}>Capacity</label>
                <input type="number" min={1} value={form.capacity} onChange={e=>setField("capacity",e.target.value)} style={inputStyle}/>
              </div>
              <div><label style={labelStyle}>Price per Hour</label>
                <div style={{ display:"flex", gap:0, borderRadius:8, overflow:"hidden", border:"2px solid #e2e8f0" }}>
                  {/* Currency toggle */}
                  <div style={{ display:"flex", flexShrink:0 }}>
                    {CURRENCIES.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setField("currency", c.code)}
                        style={{
                          padding:"9px 12px", border:"none", cursor:"pointer",
                          background: form.currency === c.code ? "#4f6fff" : "#f1f5f9",
                          color: form.currency === c.code ? "#fff" : "#64748b",
                          fontSize:12, fontWeight:700, fontFamily:"inherit",
                          transition:"all 0.15s",
                          borderRight: c.code === "LKR" ? "1px solid #e2e8f0" : "none",
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  {/* Price input */}
                  <div style={{ position:"relative", flex:1 }}>
                    <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", fontSize:13, fontWeight:600, pointerEvents:"none" }}>
                      {CURRENCIES.find(c => c.code === form.currency)?.symbol}
                    </span>
                    <input
                      type="number" min={0} step="0.01"
                      value={form.pricePerHour}
                      onChange={e => setField("pricePerHour", e.target.value)}
                      style={{ ...inputStyle, border:"none", borderRadius:0, paddingLeft:28, background:"#fff" }}
                    />
                  </div>
                </div>
              </div>
              <div><label style={labelStyle}>Status</label>
                <select value={form.status} onChange={e=>setField("status",e.target.value)} style={inputStyle}>
                  <option value="ACTIVE">Active</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Availability Windows</label>
                <TimeSlotPicker
                  value={form.availabilityWindows}
                  onChange={v => setField("availabilityWindows", v)}
                />
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e=>setField("description",e.target.value)} placeholder="Optional description..." rows={3} style={{ ...inputStyle, resize:"vertical" }}/>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:24, justifyContent:"flex-end" }}>
              <button type="button" onClick={()=>setShowForm(false)} style={{ background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:8, color:"#475569", padding:"10px 20px", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background:"linear-gradient(135deg,#4f6fff,#00e5c3)", border:"none", borderRadius:8, color:"#fff", padding:"10px 24px", cursor:saving?"not-allowed":"pointer", fontWeight:700, fontFamily:"inherit", opacity:saving?0.7:1 }}>
                {saving ? "Saving..." : editTarget ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)} small>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"#fef2f2", border:"1px solid #fecaca", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <IconTrash size={24} style={{ color:"#dc2626" }}/>
            </div>
            <h3 style={{ color:"#0f172a", margin:"0 0 8px", fontSize:18, fontWeight:800 }}>Delete Resource?</h3>
            <p style={{ color:"#64748b", margin:"0 0 24px", fontSize:14 }}>
              "<strong>{deleteConfirm.name}</strong>" will be permanently removed. This action cannot be undone.
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={()=>setDeleteConfirm(null)} style={{ background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:8, color:"#475569", padding:"10px 24px", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Cancel</button>
              <button onClick={()=>handleDelete(deleteConfirm.id)} style={{ background:"#dc2626", border:"none", borderRadius:8, color:"#fff", padding:"10px 24px", cursor:"pointer", fontWeight:700, fontFamily:"inherit" }}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

function Modal({ children, onClose, small }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(15,23,42,0.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:18, padding:"24px 20px", maxWidth:small?420:580, width:"100%", maxHeight:"92vh", overflowY:"auto", fontFamily:"inherit", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
        {children}
      </div>
    </div>
  );
}

function TblBtn({ onClick, color, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{ width:30, height:30, borderRadius:7, cursor:"pointer", background:`${color}12`, border:`1px solid ${color}30`, color, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s", flexShrink:0 }}
      onMouseEnter={e=>{ e.currentTarget.style.background=`${color}22`; e.currentTarget.style.transform="scale(1.05)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.background=`${color}12`; e.currentTarget.style.transform="scale(1)"; }}
    >{children}</button>
  );
}

function PagBtn({ onClick, disabled, active, children, title }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{ minWidth:32, height:32, borderRadius:7, cursor:disabled?"not-allowed":"pointer", background: active?"#4f6fff":"#f8fafc", border:`1px solid ${active?"#4f6fff":"#e2e8f0"}`, color: active?"#fff":"#475569", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", opacity:disabled?0.4:1, transition:"all 0.15s", padding:"0 6px" }}>
      {children}
    </button>
  );
}

function TimeSlotPicker({ value, onChange }) {
  const [startH, setStartH] = useState("08");
  const [startM, setStartM] = useState("00");
  const [endH,   setEndH]   = useState("17");
  const [endM,   setEndM]   = useState("00");
  const [open,   setOpen]   = useState(false);

  // Parse existing slots from comma-separated string
  const slots = value ? value.split(",").map(s => s.trim()).filter(Boolean) : [];

  const addSlot = () => {
    const slot = `${startH}:${startM}-${endH}:${endM}`;
    if (slots.includes(slot)) return;
    const next = [...slots, slot].join(", ");
    onChange(next);
    setOpen(false);
  };

  const removeSlot = (idx) => {
    const next = slots.filter((_, i) => i !== idx).join(", ");
    onChange(next);
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const mins  = ["00", "15", "30", "45"];

  return (
    <div style={{ position: "relative" }}>
      {/* Slot tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: slots.length ? 8 : 0 }}>
        {slots.map((slot, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#2563eb" }}>
            🕐 {slot}
            <button type="button" onClick={() => removeSlot(i)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, lineHeight: 1, padding: 0, fontWeight: 700 }}>
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Add slot button */}
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "2px dashed #cbd5e1", borderRadius: 8, padding: "9px 14px", cursor: "pointer", color: "#475569", fontSize: 13, fontWeight: 600, fontFamily: "inherit", width: "100%" }}>
        <span style={{ fontSize: 16 }}>🕐</span>
        {open ? "Close picker" : "+ Add time slot"}
      </button>

      {/* Picker dropdown */}
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 600, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 300 }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Select time slot</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center", marginBottom: 14 }}>
            {/* Start */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Start</div>
              <div style={{ display: "flex", gap: 4 }}>
                <select value={startH} onChange={e => setStartH(e.target.value)} style={{ ...inputStyle, flex: 1, padding: "7px 6px" }}>
                  {hours.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span style={{ alignSelf: "center", fontWeight: 800, color: "#475569" }}>:</span>
                <select value={startM} onChange={e => setStartM(e.target.value)} style={{ ...inputStyle, flex: 1, padding: "7px 6px" }}>
                  {mins.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div style={{ textAlign: "center", fontWeight: 800, color: "#94a3b8", fontSize: 16 }}>→</div>

            {/* End */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>End</div>
              <div style={{ display: "flex", gap: 4 }}>
                <select value={endH} onChange={e => setEndH(e.target.value)} style={{ ...inputStyle, flex: 1, padding: "7px 6px" }}>
                  {hours.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span style={{ alignSelf: "center", fontWeight: 800, color: "#475569" }}>:</span>
                <select value={endM} onChange={e => setEndM(e.target.value)} style={{ ...inputStyle, flex: 1, padding: "7px 6px" }}>
                  {mins.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12, textAlign: "center" }}>
            {startH}:{startM} → {endH}:{endM}
          </div>

          <button type="button" onClick={addSlot}
            style={{ width: "100%", background: "linear-gradient(135deg,#4f6fff,#00e5c3)", border: "none", borderRadius: 8, color: "#fff", padding: "9px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Add Slot
          </button>
        </div>
      )}
    </div>
  );
}
