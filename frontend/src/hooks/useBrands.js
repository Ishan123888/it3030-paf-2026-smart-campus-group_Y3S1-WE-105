import { useState, useEffect } from "react";

const STORAGE_KEY = "sc_brands";
const DEFAULT_BRANDS = [
  { id: "1", name: "Brand 1", description: "", contact: "" },
  { id: "2", name: "Brand 2", description: "", contact: "" },
  { id: "3", name: "Brand 3", description: "", contact: "" },
];

function loadBrands() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_BRANDS;
}

function saveBrands(brands) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
}

// Shared in-memory state so all consumers stay in sync within the same session
let _listeners = [];
let _brands = loadBrands();

function notify() {
  _listeners.forEach(fn => fn([..._brands]));
}

export function useBrands() {
  const [brands, setBrands] = useState([..._brands]);

  useEffect(() => {
    _listeners.push(setBrands);
    return () => { _listeners = _listeners.filter(fn => fn !== setBrands); };
  }, []);

  const updateBrands = (next) => {
    _brands = next;
    saveBrands(next);
    notify();
  };

  return { brands, updateBrands };
}
