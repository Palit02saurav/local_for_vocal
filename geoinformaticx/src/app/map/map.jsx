"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import axios from "axios";
// import { feature, mesh } from "topojson-client";
import SellerMapModal from "@/components/SellerMapModal/SellerMapModal";
import DistrictSellersModal from "@/components/DistrictSellersModal/DistrictSellersModal";
import "./map.css";

// ---------- SVG icons ----------
const ICON_PATHS = {
  filter: <path d="M4 5h16l-6.2 7.4V19l-3.6-1.8v-4.8L4 5z" />,
  refresh: (<><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>),
  bag: (<><path d="M5.5 8h13l-1 12h-11l-1-12z" /><path d="M9 8V7a3 3 0 0 1 6 0v1" /></>),
  wrench: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />,
  pin: (<><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>),
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  grid: (<><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  locate: (<><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>),
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
};

const Icon = ({ name, size = 18, color = "currentColor", fill = "none", stroke = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ICON_PATHS[name]}
  </svg>
);

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const STATE_ZOOM_THRESHOLD = 6; // district borders show from this zoom
const DISTRICT_ZOOM_THRESHOLD = 9; // seller pins show from this zoom

// Districts that get a border. Format: "State|District"
// (spelled as in the map data: Anantapur = Sri Sathya Sai,
//  Aurangabad = Chhatrapati Sambhajinagar, Kancheepuram = Kanchipuram)
const REGIONAL_DISTRICTS = [
  "Andhra Pradesh|Guntur", "Andhra Pradesh|Krishna", "Andhra Pradesh|Anantapur",
  "Telangana|Yadadri Bhuvanagiri", "Telangana|Karimnagar",
  "Tamil Nadu|Kancheepuram", "Tamil Nadu|Virudhunagar", "Tamil Nadu|Tiruppur",
  "Tamil Nadu|Thanjavur", "Tamil Nadu|Erode",
  "Karnataka|Ramanagara", "Karnataka|Bidar", "Karnataka|Haveri",
  "Karnataka|Kodagu", "Karnataka|Mysuru",
  "Kerala|Idukki", "Kerala|Alappuzha",
  "Maharashtra|Nashik", "Maharashtra|Ratnagiri", "Maharashtra|Kolhapur",
  "Maharashtra|Aurangabad", "Maharashtra|Nagpur",
  "Gujarat|Surat", "Gujarat|Morbi", "Gujarat|Kutch", "Gujarat|Patan", "Gujarat|Mehsana",
  "Rajasthan|Jaipur", "Rajasthan|Bikaner", "Rajasthan|Nagaur",
  "Punjab|Ludhiana", "Punjab|Jalandhar",
  "Haryana|Panipat",
  "Uttar Pradesh|Moradabad", "Uttar Pradesh|Firozabad", "Uttar Pradesh|Aligarh",
  "Uttar Pradesh|Varanasi", "Uttar Pradesh|Lucknow", "Uttar Pradesh|Bhadohi",
  "Uttar Pradesh|Kannauj", "Uttar Pradesh|Meerut", "Uttar Pradesh|Agra",
  "Bihar|Madhubani", "Bihar|Bhagalpur",
  "West Bengal|Darjeeling", "West Bengal|Malda", "West Bengal|Nadia", "West Bengal|Bankura",
  "Odisha|Cuttack", "Odisha|Sambalpur",
  "Assam|Dibrugarh", "Assam|Jorhat", "Assam|Kamrup",
  "Jammu and Kashmir|Pulwama",
  "Himachal Pradesh|Shimla", "Himachal Pradesh|Kullu",
  "Madhya Pradesh|Ashoknagar", "Madhya Pradesh|Khargone",
  "Chhattisgarh|Bastar",
];
const REGIONAL_SET = new Set(REGIONAL_DISTRICTS);

// Only West Bengal districts are shown
const isShownDistrict = (state) => state === "West Bengal";
// const SHOW_DISTRICT_BORDERS = false; // set true to show district lines again
// const INDIA_TOPO_URL =
//   "https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/topojson/india.json";
const GUIDE_STORAGE_KEY = "geoinformaticx_map_guide_seen";

const districts = [
{ name: "Darjeeling", specialty: "Darjeeling Tea", emoji: "🍵", image: "/images/darjeeling-tea.png", color: "#2d6a4f", center: { lat: 26.8533, lng: 88.2629 } },
{ name: "Jalpaiguri", specialty: "Tea Gardens", emoji: "🍃", image: "/images/jalpaiguri-tea.png", color: "#388e3c", center: { lat: 26.6814, lng: 88.7609 } },
{ name: "Alipurduar", specialty: "Dooars Tea & Forests", emoji: "🌲", image: "/images/alipurduar-tea.png", color: "#1b5e20", center: { lat: 26.6306, lng: 89.4568 } },
{ name: "Cooch Behar", specialty: "Sitalpati Cane Mats", emoji: "🎋", image: "/images/coochbehar-sitalpati.png", color: "#6d4c41", center: { lat: 26.2918, lng: 89.3459 } },
{ name: "Kalimpong", specialty: "Handmade Cheese & Orchids", emoji: "🧀", image: "/images/kalimpong-cheese.png", color: "#ffb300", center: { lat: 27.0333, lng: 88.6289 } },
{ name: "Uttar Dinajpur", specialty: "Litchi & Mangoes", emoji: "🍈", image: "/images/uttar-dinajpur-litchi.png", color: "#7cb342", center: { lat: 25.8885, lng: 88.1572 } },
{ name: "Dakshin Dinajpur", specialty: "Tulaipanji Rice", emoji: "🌾", image: "/images/dakshin-dinajpur-rice.png", color: "#9e9d24", center: { lat: 25.3672, lng: 88.5750 } },
{ name: "Malda", specialty: "Malda Mangoes", emoji: "🥭", image: "/images/malda-mango.png", color: "#f57f17", center: { lat: 25.1421, lng: 88.0886 } },
{ name: "Murshidabad", specialty: "Murshidabad Silk", emoji: "🧵", image: "/images/murshidabad-silk.png", color: "#4a90d9", center: { lat: 24.1708, lng: 88.2288 } },
{ name: "Birbhum", specialty: "Nakshi Kantha & Leatherwork", emoji: "🪡", image: "/images/birbhum-crafts.png", color: "#8d6e63", center: { lat: 23.9546, lng: 87.6633 } },
{ name: "Nadia", specialty: "Shantipur Handloom", emoji: "🧶", image: "/images/nadia-shantipur.png", color: "#e07b2a", center: { lat: 23.4787, lng: 88.5167 } },
{ name: "Purba Bardhaman", specialty: "Sitabhog & Mihidana Sweets", emoji: "🍬", image: "/images/purba-bardhaman-sitabhog.png", color: "#d81b60", center: { lat: 23.3598, lng: 87.9472 } },
{ name: "Paschim Bardhaman", specialty: "Steel & Coal Industry", emoji: "🏭", image: "/images/paschim.png", color: "#546e7a", center: { lat: 23.6614, lng: 87.1602 } },
{ name: "Purulia", specialty: "Chhau Mask & Dance", emoji: "🎭", image: "/images/purulia-chhau.png", color: "#6a1b9a", center: { lat: 23.2772, lng: 86.4214 } },  
{ name: "Bankura", specialty: "Dokra & Terracotta Craft", emoji: "🏺", image: "/images/bankura-dokra.png", color: "#8e44ad", center: { lat: 23.1392, lng: 87.1359 } },
{ name: "Jhargram", specialty: "Tribal Sal-leaf Crafts", emoji: "🍂", image: "/images/jhargram-salleaf.png", color: "#33691e", center: { lat: 22.3630, lng: 86.9558 } },
{ name: "Paschim Medinipur", specialty: "Patachitra Scroll Art", emoji: "🎨", image: "/images/paschim-medinipur-patachitra.png", color: "#c2185b", center: { lat: 22.4392, lng: 87.4173 } },
{ name: "Purba Medinipur", specialty: "Madur Mat Weaving", emoji: "🧺", image: "/images/purba-medinipur-weave.png", color: "#00838f", center: { lat: 22.0086, lng: 87.7502 } },
{ name: "Hooghly", specialty: "Dhaniakhali Handloom", emoji: "🧵", image: "/images/hooghly-handloom.png", color: "#ef6c00", center: { lat: 22.8836, lng: 88.0725 } },
  { name: "Howrah", specialty: "Foundry & Metal Casting", emoji: "⚙️", color: "#37474f", center: { lat: 22.5238, lng: 88.0637 } },
{ name: "North 24 Parganas", specialty: "Leather Industry", emoji: "👜", image: "/images/north24parganas-leather.png", color: "#5d4037", center: { lat: 22.7270, lng: 88.7305 } },
{ name: "South 24 Parganas", specialty: "Joynagarer Moa", emoji: "🍬", image: "/images/south24parganas-moa.png", color: "#d84315", center: { lat: 22.1667, lng: 88.4167 } },
{ name: "Kolkata", specialty: "Rosogolla & Sweets", emoji: "🍥", image: "/images/kolkata-rosogolla.png", color: "#c62828", center: { lat: 22.5585, lng: 88.3438 } },
];

// Seller `location` is free text, so match it loosely against the
// district names above rather than requiring an exact match.
function resolveDistrict(locationText) {
  if (!locationText) return null;
  const normalized = locationText.trim().toLowerCase();
  return (
    districts.find(
      (d) =>
        normalized.includes(d.name.toLowerCase()) ||
        d.name.toLowerCase().includes(normalized)
    ) || null
  );
}

function toCircleIcon(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = 96;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const side = Math.min(img.width, img.height);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

// Straight-line distance in km between two lat/lng points.
function haversineKm(a, b) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function districtForSeller(seller) {
  const byText = resolveDistrict(seller.location);
  if (byText) return byText.name;

  const lat = Number(seller.latitude);
  const lng = Number(seller.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  let best = null;
  let bestKm = Infinity;
  districts.forEach((d) => {
    const km = haversineKm({ lat, lng }, d.center);
    if (km < bestKm) {
      bestKm = km;
      best = d;
    }
  });
  return best ? best.name : null;
}

// const categoryOptions = {
//   Products: ["All Categories", "Handicrafts", "Household", "Pottery", "Food", "Beverages"],
//   // Services: ["All Categories", "Maid", "Teacher", "Plumber"],
// };

// Is a point inside a polygon outline?
function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(lng, lat, rings) {
  if (!pointInRing(lng, lat, rings[0])) return false;
  for (let k = 1; k < rings.length; k++) {
    if (pointInRing(lng, lat, rings[k])) return false;
  }
  return true;
}

function pointInGeometry(lng, lat, g) {
  if (g.type === "Polygon") return pointInPolygon(lng, lat, g.coordinates);
  if (g.type === "MultiPolygon") return g.coordinates.some((p) => pointInPolygon(lng, lat, p));
  return false;
}

// Which district (of any state) is this lat/lng in?
function districtKeyForPoint(geoDistricts, lat, lng) {
  for (const d of geoDistricts) {
    const [x1, y1, x2, y2] = d.bbox;
    if (lng < x1 || lng > x2 || lat < y1 || lat > y2) continue;
    if (pointInGeometry(lng, lat, d.geometry)) return d.key;
  }
  // point is just outside an outline: use the nearest district center
  let best = null;
  let bestKm = Infinity;
  geoDistricts.forEach((d) => {
    const km = haversineKm({ lat, lng }, d.center);
    if (km < bestKm) {
      bestKm = km;
      best = d;
    }
  });
  return best && bestKm < 50 ? best.key : null;
}

export default function MapExplore() {
  const router = useRouter();
  const mapRef = useRef(null);
  const [type, setType] = useState("Products");
  const [category, setCategory] = useState("All Categories");
  const [rating, setRating] = useState(0);
  const [distance, setDistance] = useState(20);
  const [regionalOnly, setRegionalOnly] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [liveListings, setLiveListings] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [productCategories, setProductCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [serviceRes, productRes] = await Promise.all([
          axios.get(`${API_BASE}/categories/public`, { params: { type: "service" } }),
          axios.get(`${API_BASE}/categories/public`, { params: { type: "product" } }),
        ]);
        setServiceCategories((serviceRes.data.data?.categories || []).map((c) => c.name));
        setProductCategories((productRes.data.data?.categories || []).map((c) => c.name));
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    loadCategories();
  }, []);

  const currentCategoryOptions = [
    "All Categories",
    ...(type === "Services" ? serviceCategories : productCategories),
  ];
  const [showGuide, setShowGuide] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/sellers/public`)
      .then((res) => setSellers(res.data.data?.sellers || []))
      .catch((err) => console.error("Failed to load sellers:", err));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(GUIDE_STORAGE_KEY)) {
      setShowGuide(true);
    }
  }, []);

  const dismissGuide = () => {
    setShowGuide(false);
    window.localStorage.setItem(GUIDE_STORAGE_KEY, "1");
  };

  // Real sellers, placed on the map via their store location matched
  // against the district list above (used as a lightweight geocoder).
  useEffect(() => {
    const loadListings = async () => {
      try {
        const [productsRes, servicesRes] = await Promise.all([
          axios.get(`${API_BASE}/products/public`),
          axios.get(`${API_BASE}/services/public`),
        ]);
        const products = productsRes.data.data?.products || [];
        const services = servicesRes.data.data?.services || [];

        const toListing = (item, i, itemType) => {
          const sellerLat = item.seller?.latitude;
          const sellerLng = item.seller?.longitude;
          if (sellerLat == null || sellerLng == null) return null;

          const district = resolveDistrict(item.seller?.location);
          return {
            id: item.id,
            sku: item.sku,
            price: Number(item.price || 0),
            type: itemType,
            category: item.category,
            name: item.name,
            sellerId: item.seller?.id,
            seller: item.seller?.store_name || item.seller?.full_name || "Seller",
            sellerLocation: item.seller?.location || "",
            rating: item.avg_rating ?? 0,
            lat: Number(sellerLat),
            lng: Number(sellerLng),
            district: district?.name || null,
            img: item.image_url || "https://placehold.co/300x300?text=No+Image",
            regional: item.product_type === "Regional Famous",
          };
        };

        const productListings = products.map((p, i) => toListing(p, i, "Products")).filter(Boolean);
        const serviceListings = services.map((s, i) => toListing(s, i, "Services")).filter(Boolean);
        setLiveListings([...productListings, ...serviceListings]);
      } catch (err) {
        console.error("Failed to load map listings:", err);
      }
    };
    loadListings();
  }, []);

  const filteredListings = liveListings.filter((l) => {
    if (l.type !== type) return false;
    if (regionalOnly && !l.regional) return false;
    if (category !== "All Categories" && l.category !== category) return false;
    if (l.rating < rating) return false;
    const q = searchText.trim().toLowerCase();
    if (
      q &&
      ![l.name, l.seller, l.category, l.sellerLocation, l.district].some((v) =>
        (v || "").toLowerCase().includes(q)
      )
    )
      return false;
    return true;
  });

  // Refs mirror the latest data so map-event closures created once on
  // mount (idle/zoom listeners) always read fresh values.
  const filteredListingsRef = useRef([]);
  useEffect(() => {
    filteredListingsRef.current = filteredListings;
  }, [filteredListings]);

  const sellersByDistrictRef = useRef({});
  useEffect(() => {
    const grouped = {};
    sellers.forEach((s) => {
      const name = districtForSeller(s);
      if (!name) return;
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(s);
    });
    sellersByDistrictRef.current = grouped;
  }, [sellers]);

  const regionalByDistrictRef = useRef({});
  useEffect(() => {
    const grouped = {};
    liveListings.forEach((l) => {
      if (l.type !== type) return;
      if (!l.regional || !l.district) return;
      if (!grouped[l.district]) grouped[l.district] = [];
      grouped[l.district].push(l);
    });
    regionalByDistrictRef.current = grouped;
  }, [liveListings, type]);

  const sellersByIdRef = useRef({});
  useEffect(() => {
    // Seed from every approved seller first, so a seller with zero
    // products/services (opened from the district list) is still clickable.
    const grouped = {};
    sellers.forEach((s) => {
      grouped[s.id] = {
        id: s.id,
        name: s.store_name || s.full_name || "Seller",
        location: s.location || "",
        phone: s.phone || null,
        lat: Number(s.latitude),
        lng: Number(s.longitude),
        img: null,
        regionalProducts: [],
        otherProducts: [],
      };
    });

    // Layer in live listings: refine the image, attach products.
    liveListings.forEach((l) => {
      if (!l.sellerId) return;
      if (!grouped[l.sellerId]) {
        grouped[l.sellerId] = {
          id: l.sellerId,
          name: l.seller,
          location: l.sellerLocation,
          phone: null,
          lat: l.lat,
          lng: l.lng,
          img: null,
          regionalProducts: [],
          otherProducts: [],
        };
      }
      if (!grouped[l.sellerId].img) grouped[l.sellerId].img = l.img;
      if (l.regional) {
        grouped[l.sellerId].regionalProducts.push(l);
      } else {
        grouped[l.sellerId].otherProducts.push(l);
      }
    });
    sellersByIdRef.current = grouped;
  }, [liveListings, sellers]);
  const mapObjRef = useRef(null);
  const overlaysRef = useRef({ districtMarkers: [], sellerMarkers: [], boundaryLayers: [] });

  const clearOverlays = () => {
    overlaysRef.current.districtMarkers.forEach((m) => m.setMap(null));
    overlaysRef.current.sellerMarkers.forEach((m) => m.setMap(null));
    (overlaysRef.current.boundaryLayers || []).forEach((layer) => layer.setMap(null));
    overlaysRef.current = { districtMarkers: [], sellerMarkers: [], boundaryLayers: [] };
  };

  const clearSpecialtyAndSellerMarkers = () => {
    overlaysRef.current.districtMarkers.forEach((m) => m.setMap(null));
    overlaysRef.current.sellerMarkers.forEach((m) => m.setMap(null));
    overlaysRef.current.districtMarkers = [];
    overlaysRef.current.sellerMarkers = [];
  };

  const hoverCloseTimeoutRef = useRef(null);

  const cancelPendingClose = () => {
    if (hoverCloseTimeoutRef.current) {
      clearTimeout(hoverCloseTimeoutRef.current);
      hoverCloseTimeoutRef.current = null;
    }
  };

  const scheduleClose = (infoWindow) => {
    cancelPendingClose();
    hoverCloseTimeoutRef.current = setTimeout(() => infoWindow.close(), 200);
  };

  const renderSellerLevel = (map, infoWindow, listings) => {
    const bounds = map.getBounds();

    // Dedupe filtered listings down to one entry per seller.
    const sellersSeen = new Map();
    // All matching services of each seller (for the "View Detail" buttons).
    const servicesBySeller = new Map();
    listings.forEach((item) => {
      if (!item.sellerId) return;
      if (item.type === "Services" && item.sku) {
        if (!servicesBySeller.has(item.sellerId)) servicesBySeller.set(item.sellerId, []);
        servicesBySeller.get(item.sellerId).push(item);
      }
      if (sellersSeen.has(item.sellerId)) return;
      sellersSeen.set(item.sellerId, item);
    });
    const escapeHtml = (str = "") =>
      String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    sellersSeen.forEach((item) => {
      const position = { lat: item.lat, lng: item.lng };
      if (bounds && !bounds.contains(position)) return;

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: item.seller,
      });
      overlaysRef.current.sellerMarkers.push(marker);

      const popupId = `seller-popup-${item.sellerId}`;
      const viewStoreBtnId = `view-store-btn-${item.sellerId}`;
      // Only for the Services tab: one "View Detail" button per matching service (max 3)
      const sellerServices =
        item.type === "Services" ? (servicesBySeller.get(item.sellerId) || []).slice(0, 3) : [];

      marker.addListener("mouseover", () => {
        cancelPendingClose();

        const detailButtonsHtml = sellerServices
          .map(
            (svc, i) => `
            <button id="view-detail-btn-${item.sellerId}-${i}" style="width:100%;padding:6px 0;margin-bottom:6px;background:#fff;color:#2d6a4f;border:1.5px solid #2d6a4f;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;">
              ${sellerServices.length > 1 ? `View Detail – ${escapeHtml(svc.name)}` : "View Detail"}
            </button>`
          )
          .join("");

        infoWindow.setContent(`
          <div id="${popupId}" style="width:190px;font-family:Segoe UI, Arial, sans-serif;">
            <img src="${item.img}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />
            <div style="font-weight:700;font-size:13px;color:#1a1a1a;">${item.seller}</div>
            <div style="font-size:11.5px;color:#888;margin-bottom:8px;">${item.sellerLocation || "Location not set"}</div>
            ${detailButtonsHtml}
            <button id="${viewStoreBtnId}" style="width:100%;padding:6px 0;background:#2d6a4f;color:#fff;border:none;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;">
              View Store
            </button>
          </div>
        `);
        infoWindow.open(map, marker);

        window.google.maps.event.addListenerOnce(infoWindow, "domready", () => {
          const popupEl = document.getElementById(popupId);
          const btnEl = document.getElementById(viewStoreBtnId);
          if (!popupEl || !btnEl) return;

          popupEl.addEventListener("mouseenter", cancelPendingClose);
          popupEl.addEventListener("mouseleave", () => scheduleClose(infoWindow));

          sellerServices.forEach((svc, i) => {
            const detailBtn = document.getElementById(`view-detail-btn-${item.sellerId}-${i}`);
            if (!detailBtn) return;
            detailBtn.addEventListener("click", () => {
              cancelPendingClose();
              infoWindow.close();
              router.push(`/services/${encodeURIComponent(svc.sku)}`);
            });
          });

          btnEl.addEventListener("click", () => {
            cancelPendingClose();
            infoWindow.close();
            setSelectedSellerId(item.sellerId);
          });
        });
      });

      marker.addListener("mouseout", () => scheduleClose(infoWindow));

      marker.addListener("click", () => {
        setSelectedSellerId(item.sellerId);
      });
    });
  };

// const renderDistrictBoundaries = (map) => {
//   const stateLayer = new window.google.maps.Data({ map });
//   stateLayer.loadGeoJson("/geo/west-bengal-state.geojson");
//   stateLayer.setStyle({
//     strokeColor: "#000000",
//     strokeWeight: 3,
//     strokeOpacity: 1,
//     fillOpacity: 0,
//     clickable: false,
//     zIndex: 4,
//   });

//   overlaysRef.current.boundaryLayers = [stateLayer];

//   if (SHOW_DISTRICT_BORDERS) {
//     const districtLayer = new window.google.maps.Data({ map });
//     districtLayer.loadGeoJson("/geo/west-bengal-districts.geojson");
//     districtLayer.setStyle({
//       strokeColor: "#000000",
//       strokeWeight: 1.2,
//       strokeOpacity: 0.8,
//       fillOpacity: 0,
//       clickable: false,
//       zIndex: 1,
//     });
//     overlaysRef.current.boundaryLayers.push(districtLayer);
//   }
// };

  //   const renderIndiaBoundaries = async (map) => {
  //   try {
  //     const res = await fetch(INDIA_TOPO_URL);
  //     const topo = await res.json();
  //     const obj = topo.objects.districts;
  //     const notWB = (d) => d.properties.st_nm !== "West Bengal";

  //     // keep every district: state, name, outline, center point
  //     const geoDistricts = feature(topo, obj).features.map((f) => {
  //       let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  //       const walk = (c) => {
  //         if (typeof c[0] === "number") {
  //           minLng = Math.min(minLng, c[0]); maxLng = Math.max(maxLng, c[0]);
  //           minLat = Math.min(minLat, c[1]); maxLat = Math.max(maxLat, c[1]);
  //         } else {
  //           c.forEach(walk);
  //         }
  //       };
  //       walk(f.geometry.coordinates);
  //       const state = f.properties.st_nm;
  //       const name = f.properties.district;
  //       return {
  //         key: `${state}|${name}`,
  //         state,
  //         name,
  //         geometry: f.geometry,
  //         bbox: [minLng, minLat, maxLng, maxLat],
  //         center: { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 },
  //       };
  //     });
  //     geoDistrictsRef.current = geoDistricts;

  //     // 1) district borders of all states (thin) - West Bengal skipped
  //     if (SHOW_DISTRICT_BORDERS) {
  //       const districtFC = feature(topo, obj);
  //       districtFC.features = districtFC.features.filter(
  //         (f) => f.properties.st_nm !== "West Bengal"
  //       );
  //       const indiaDistrictLayer = new window.google.maps.Data({ map });
  //       indiaDistrictLayer.addGeoJson(districtFC);
  //       indiaDistrictLayer.setStyle({
  //         strokeColor: "#000000",
  //         strokeWeight: 0.8,
  //         strokeOpacity: 0.6,
  //         fillOpacity: 0,
  //         clickable: false,
  //         zIndex: 1,
  //       });
  //       overlaysRef.current.boundaryLayers.push(indiaDistrictLayer);
  //     }

  //     // 1b) borders of the famous districts only
  //     const famousFC = {
  //       type: "FeatureCollection",
  //       features: feature(topo, obj).features.filter((f) =>
  //         isShownDistrict(
  //           f.properties.st_nm,
  //           `${f.properties.st_nm}|${f.properties.district}`
  //         )
  //       ),
  //     };
  //     const famousLayer = new window.google.maps.Data({ map });
  //     famousLayer.addGeoJson(famousFC);
  //     famousLayer.setStyle({
  //       strokeColor: "#1b5e20",
  //       strokeWeight: 1,
  //       strokeOpacity: 0.8,
  //       fillColor: "#2d6a4f",
  //       fillOpacity: 0.08,
  //       clickable: true,
  //       zIndex: 1,
  //     });

  //     // hover: highlight the district and show a label with its seller count
  //     const sellersInDistrict = (key) => {
  //       const d = geoDistrictsRef.current.find((x) => x.key === key);
  //       if (!d) return 0;
  //       const seen = new Set();
  //       filteredListingsRef.current.forEach((l) => {
  //         if (!l.sellerId || seen.has(l.sellerId)) return;
  //         const [x1, y1, x2, y2] = d.bbox;
  //         if (l.lng < x1 || l.lng > x2 || l.lat < y1 || l.lat > y2) return;
  //         if (pointInGeometry(l.lng, l.lat, d.geometry)) seen.add(l.sellerId);
  //       });
  //       return seen.size;
  //     };

  //     famousLayer.addListener("mouseover", (e) => {
  //       famousLayer.revertStyle();
  //       famousLayer.overrideStyle(e.feature, {
  //         strokeColor: "#e65100",
  //         strokeWeight: 3,
  //         strokeOpacity: 1,
  //         zIndex: 3,
  //       });
  //       const name = e.feature.getProperty("district");
  //       const state = e.feature.getProperty("st_nm");
  //       const rect = mapRef.current.getBoundingClientRect();
  //       setDistrictTip({
  //         x: e.domEvent.clientX - rect.left,
  //         y: e.domEvent.clientY - rect.top,
  //         name,
  //         state,
  //         count: sellersInDistrict(`${state}|${name}`),
  //       });
  //     });

  //     famousLayer.addListener("mousemove", (e) => {
  //       // move the label directly, no page re-render on every mouse move
  //       if (!tipRef.current) return;
  //       const rect = mapRef.current.getBoundingClientRect();
  //       tipRef.current.style.left = `${e.domEvent.clientX - rect.left + 14}px`;
  //       tipRef.current.style.top = `${e.domEvent.clientY - rect.top + 14}px`;
  //     });

  //     famousLayer.addListener("mouseout", () => {
  //       famousLayer.revertStyle();
  //       setDistrictTip(null);
  //     });
  //     overlaysRef.current.boundaryLayers.push(famousLayer);
  //     famousLayerRef.current = famousLayer;

  //     // 2) state borders (medium) - only lines where two different states meet
  //     const stateLines = mesh(
  //       topo,
  //       obj,
  //       (a, b) =>
  //         a !== b &&
  //         a.properties.st_nm !== b.properties.st_nm &&
  //         notWB(a) &&
  //         notWB(b)
  //     );
  //     const indiaStateLayer = new window.google.maps.Data({ map });
  //     indiaStateLayer.addGeoJson({ type: "Feature", properties: {}, geometry: stateLines });
  //     indiaStateLayer.setStyle({
  //       strokeColor: "#000000",
  //       strokeWeight: 2.5,
  //       strokeOpacity: 1,
  //       clickable: false,
  //       zIndex: 4,
  //     });

  //     // 3) India outer border (thick) - only the outside edge
  //     const countryLines = mesh(topo, obj, (a, b) => a === b && notWB(a));
  //     const indiaCountryLayer = new window.google.maps.Data({ map });
  //     indiaCountryLayer.addGeoJson({ type: "Feature", properties: {}, geometry: countryLines });
  //     indiaCountryLayer.setStyle({
  //       strokeColor: "#000000",
  //       strokeWeight: 3.5,
  //       strokeOpacity: 1,
  //       clickable: false,
  //       zIndex: 5,
  //     });

  //     overlaysRef.current.boundaryLayers.push(
  //       indiaStateLayer,
  //       indiaCountryLayer
  //     );

  //     if (mapObjRef.current && infoWindowRef.current) {
  //       redrawForZoom(mapObjRef.current, infoWindowRef.current);
  //     }
  //   } catch (err) {
  //     console.error("Failed to load India boundaries:", err);
  //   }
  // };

  const renderIndiaBoundaries = async (map) => {
    try {
      const [statesRes, districtsRes, imagesRes] = await Promise.all([
        axios.get(`${API_BASE}/geo/states`, { params: { geometry: 1 } }),
        axios.get(`${API_BASE}/geo/districts`),
        axios.get(`${API_BASE}/geo/district-images`).catch(() => null),
      ]);
      const uploadedImages = imagesRes?.data?.data?.images || [];
      districtImagesRef.current = await Promise.all(
        uploadedImages.map(async (u) => ({ ...u, icon: await toCircleIcon(u.image_url) }))
      );
      const states = statesRes.data.data?.states || [];
      const districtFC = districtsRes.data.data?.districts;
      if (!districtFC) return;

      // every district from the database: state, name, outline, box, center
      geoDistrictsRef.current = districtFC.features.map((f) => ({
        key: `${f.properties.st_nm}|${f.properties.district}`,
        state: f.properties.st_nm,
        name: f.properties.district,
        geometry: f.geometry,
        bbox: f.properties.bbox,
        center: f.properties.center,
      }));

      // 1) district borders
      const famousFC = {
        type: "FeatureCollection",
        features: districtFC.features.filter((f) =>
          isShownDistrict(
            f.properties.st_nm,
            `${f.properties.st_nm}|${f.properties.district}`
          )
        ),
      };
      const famousLayer = new window.google.maps.Data({ map });
      famousLayer.addGeoJson(famousFC);
      famousLayer.setStyle({
        strokeColor: "#1b5e20",
        strokeWeight: 1,
        strokeOpacity: 0.8,
        fillColor: "#2d6a4f",
        fillOpacity: 0.08,
        clickable: true,
        zIndex: 1,
      });

      // hover: highlight the district and show a label with its seller count
      const sellersInDistrict = (key) => {
        const d = geoDistrictsRef.current.find((x) => x.key === key);
        if (!d) return 0;
        const seen = new Set();
        filteredListingsRef.current.forEach((l) => {
          if (!l.sellerId || seen.has(l.sellerId)) return;
          const [x1, y1, x2, y2] = d.bbox;
          if (l.lng < x1 || l.lng > x2 || l.lat < y1 || l.lat > y2) return;
          if (pointInGeometry(l.lng, l.lat, d.geometry)) seen.add(l.sellerId);
        });
        return seen.size;
      };

      famousLayer.addListener("mouseover", (e) => {
        famousLayer.revertStyle();
        famousLayer.overrideStyle(e.feature, {
          strokeColor: "#e65100",
          strokeWeight: 3,
          strokeOpacity: 1,
          zIndex: 3,
        });
        const name = e.feature.getProperty("district");
        const state = e.feature.getProperty("st_nm");
        const rect = mapRef.current.getBoundingClientRect();
        setDistrictTip({
          x: e.domEvent.clientX - rect.left,
          y: e.domEvent.clientY - rect.top,
          name,
          state,
          count: sellersInDistrict(`${state}|${name}`),
        });
      });

      famousLayer.addListener("mousemove", (e) => {
        if (!tipRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        tipRef.current.style.left = `${e.domEvent.clientX - rect.left + 14}px`;
        tipRef.current.style.top = `${e.domEvent.clientY - rect.top + 14}px`;
      });

      famousLayer.addListener("mouseout", () => {
        famousLayer.revertStyle();
        setDistrictTip(null);
      });
      overlaysRef.current.boundaryLayers.push(famousLayer);
      famousLayerRef.current = famousLayer;

      // 2) state borders (from the database), drawn as plain lines
      let drawnStates = 0;
      states.forEach((s) => {
        if (s.name !== "West Bengal") return; // only West Bengal border
        const g = s.geometry;
        if (!g || !g.coordinates || !g.coordinates.length) {
          console.warn("State has no outline:", s.name);
          return;
        }
        const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
        polys.forEach((poly) => {
          poly.forEach((ring) => {
            const line = new window.google.maps.Polyline({
              path: ring.map(([lng, lat]) => ({ lat, lng })),
              map,
              strokeColor: "#000000",
              strokeWeight: 2.5,
              strokeOpacity: 1,
              clickable: false,
              zIndex: 4,
            });
            overlaysRef.current.boundaryLayers.push(line);
          });
        });
        drawnStates += 1;
      });
      console.log("State borders drawn:", drawnStates, "of", states.length);

      if (mapObjRef.current && infoWindowRef.current) {
        redrawForZoom(mapObjRef.current, infoWindowRef.current);
      }
    } catch (err) {
      console.error("Failed to load India boundaries:", err);
    }
  };

  const geoDistrictsRef = useRef([]);
  const districtImagesRef = useRef([]);
  const famousLayerRef = useRef(null);
  const [districtTip, setDistrictTip] = useState(null); // { x, y, name, state, count }
  const tipRef = useRef(null);

  const renderDistrictSpecialtyMarkers = (map, infoWindow) => {
    const uploaded = districtImagesRef.current
      .filter((u) => u.state_name === "West Bengal")
      .map((u) => {
        const geo = geoDistrictsRef.current.find(
          (g) => g.key === `${u.state_name}|${u.district_name}`
        );
        if (!geo) return null;
        const base = u.state_name === "West Bengal"
          ? districts.find((d) => d.name === u.district_name)
          : null;
        return {
          name: u.district_name,
          state: u.state_name,
          specialty: base?.specialty || "Regional specialty",
          emoji: base?.emoji || "📍",
          color: base?.color || "#2d6a4f",  
          image: u.icon,
          center: geo.center,
        };
      })
      .filter(Boolean);
    const replaced = new Set(
      uploaded.filter((u) => u.state === "West Bengal").map((u) => u.name)
    );
    const allMarkers = [...districts.filter((d) => !replaced.has(d.name)), ...uploaded];
    allMarkers.forEach((districtInfo) => {
      const items = regionalByDistrictRef.current[districtInfo.name] || [];

      const marker = new window.google.maps.Marker({
        position: districtInfo.center,
        map,
        title: `${districtInfo.name} — ${districtInfo.specialty}`,
        icon: districtInfo.image
          ? {
              url: districtInfo.image,
              scaledSize: new window.google.maps.Size(36, 36),
              anchor: new window.google.maps.Point(18, 18),
            }
          : {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 15,
              fillColor: districtInfo.color,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
        label: districtInfo.image ? undefined : { text: districtInfo.emoji, fontSize: "14px" },
        zIndex: 2,
      });
      overlaysRef.current.districtMarkers.push(marker);

      marker.addListener("mouseover", () => {
        cancelPendingClose();

        const sellerCount = (sellersByDistrictRef.current[districtInfo.name] || []).length;
        const safeName = districtInfo.name.replace(/\s+/g, "-");
        const popupId = `district-popup-${safeName}`;
        const countBtnId = `district-seller-count-${safeName}`;

        const countLine = sellerCount > 0
          ? `<button id="${countBtnId}" style="display:block;width:100%;text-align:left;background:none;border:none;padding:0;margin-top:6px;font-size:12px;font-weight:600;color:#2d6a4f;cursor:pointer;text-decoration:underline;">
               ${sellerCount} seller${sellerCount === 1 ? "" : "s"} in this district
             </button>`
          : `<div style="font-size:12px;font-weight:600;color:#aaa;margin-top:6px;">No sellers here yet</div>`;

        const itemsList = items.length
          ? items
              .map(
                (it) => `
                  <div style="padding:5px 0;border-top:1px solid #eee;">
                    <div style="font-size:12px;font-weight:600;color:#333;">${it.name}</div>
                    <div style="font-size:10.5px;color:#999;">By ${it.seller}</div>
                  </div>
                `
              )
              .join("")
          : "";

        infoWindow.setContent(`
          <div id="${popupId}" style="min-width:200px;max-width:240px;max-height:220px;overflow-y:auto;font-family:Segoe UI, Arial, sans-serif;">
            <div style="font-weight:700;font-size:14px;color:#1a1a1a;">${districtInfo.name}</div>
            <div style="font-size:11.5px;color:#666;margin-top:3px;">Famous for: ${districtInfo.specialty}</div>
            ${countLine}
            ${itemsList}
          </div>
        `);
        infoWindow.open(map, marker);

        window.google.maps.event.addListenerOnce(infoWindow, "domready", () => {
          const popupEl = document.getElementById(popupId);
          const countBtnEl = document.getElementById(countBtnId);
          if (!popupEl) return;

          popupEl.addEventListener("mouseenter", cancelPendingClose);
          popupEl.addEventListener("mouseleave", () => scheduleClose(infoWindow));

          if (countBtnEl) {
            countBtnEl.addEventListener("click", () => {
              cancelPendingClose();
              infoWindow.close();
              setSelectedDistrict(districtInfo.name);
            });
          }
        });
      });
      marker.addListener("mouseout", () => scheduleClose(infoWindow));

      marker.addListener("click", () => {
        map.setCenter(districtInfo.center);
        map.setZoom(DISTRICT_ZOOM_THRESHOLD + 2);
      });
    });
  };

  const redrawForZoom = (map, infoWindow) => {
    clearSpecialtyAndSellerMarkers();
    const zoom = map.getZoom();

    // district borders: visible from zoom 6 and up
    if (famousLayerRef.current) {
      const showBorders = zoom >= STATE_ZOOM_THRESHOLD;
      famousLayerRef.current.setMap(showBorders ? map : null);
      if (!showBorders) setDistrictTip(null);
    }

    if (zoom < DISTRICT_ZOOM_THRESHOLD) {
      renderDistrictSpecialtyMarkers(map, infoWindow);
    } else {
      renderSellerLevel(map, infoWindow, filteredListingsRef.current);
    }
  };

  const infoWindowRef = useRef(null);

  useEffect(() => {
    const loadMap = () => {
      if (!window.google || !mapRef.current || mapObjRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 24.0, lng: 87.9 },
        zoom: 7,
        minZoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
      });

      mapObjRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow();

      renderIndiaBoundaries(map);
      redrawForZoom(map, infoWindowRef.current);

      map.addListener("idle", () => {
        redrawForZoom(mapObjRef.current, infoWindowRef.current);
      });
    };

    if (window.google) {
      loadMap();
    } else if (!document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API}`;
      script.async = true;
      script.defer = true;
      script.onload = loadMap;
      document.head.appendChild(script);
    } else {
      document.getElementById("google-maps-script").addEventListener("load", loadMap);
    }

    return () => clearOverlays();
  }, []);

  useEffect(() => {
    if (!mapObjRef.current || !infoWindowRef.current) return;
    redrawForZoom(mapObjRef.current, infoWindowRef.current);
  }, [type, category, rating, distance, regionalOnly, liveListings, sellers, searchText]);

  const userMarkerRef = useRef(null);
  const userCircleRef = useRef(null);
  const [locating, setLocating] = useState(false);
  const [locationMsg, setLocationMsg] = useState("");

  const locateMe = () => {
    const map = mapObjRef.current;
    if (!map) return;
    if (!navigator.geolocation) {
      setLocationMsg("Your browser does not support location.");
      return;
    }
    setLocating(true);
    setLocationMsg("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        if (userMarkerRef.current) userMarkerRef.current.setMap(null);
        if (userCircleRef.current) userCircleRef.current.setMap(null);

        // light circle = how accurate the location is
        userCircleRef.current = new window.google.maps.Circle({
          map,
          center: p,
          radius: pos.coords.accuracy,
          strokeColor: "#4285F4",
          strokeOpacity: 0.4,
          strokeWeight: 1,
          fillColor: "#4285F4",
          fillOpacity: 0.12,
          clickable: false,
          zIndex: 1,
        });

        // blue dot = you
        userMarkerRef.current = new window.google.maps.Marker({
          position: p,
          map,
          title: "You are here",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
          zIndex: 10,
        });

        map.setCenter(p);
        map.setZoom(14);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationMsg(
          err.code === 1
            ? "Location permission denied. Allow it in your browser settings."
            : "Could not get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const resetAll = () => {
    setType("Products");
    setCategory("All Categories");
    setRating(0);
    setDistance(20);
    setRegionalOnly(false);
    setSearchText("");
  };

  // filters already apply live; this just redraws the map
  const applyFilters = () => {
    if (mapObjRef.current && infoWindowRef.current) {
      redrawForZoom(mapObjRef.current, infoWindowRef.current);
    }
  };

  const zoomBy = (delta) => {
    const map = mapObjRef.current;
    if (map) map.setZoom((map.getZoom() || 7) + delta);
  };

  const toggleFullscreen = () => {
    const el = mapRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const map = mapObjRef.current;
    if (!map || !searchText.trim() || !filteredListings.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    filteredListings.forEach((l) => bounds.extend({ lat: l.lat, lng: l.lng }));
    map.fitBounds(bounds, 60);
    window.google.maps.event.addListenerOnce(map, "idle", () => {
      if (map.getZoom() < DISTRICT_ZOOM_THRESHOLD) map.setZoom(DISTRICT_ZOOM_THRESHOLD);
    });
  };

  const distPct = ((distance - 1) / 19) * 100;

  return (
    <div className="map-explore-page">
      <aside className="map-filter-panel">
        <div className="map-filter-head">
          <div className="map-filter-logo">
            <Icon name="filter" size={22} color="#2d6a4f" />
          </div>
          <div className="map-filter-head-text">
            <h3 className="map-filter-title">Filter</h3>
            <p>Find products and services near you</p>
          </div>
          <button type="button" className="map-reset-btn" onClick={resetAll}>
            <Icon name="refresh" size={14} /> Reset All
          </button>
        </div>

        <div className="map-filter-section">
          <h4>Type</h4>
          <div className="map-type-toggle">
            <button
              type="button"
              className={type === "Products" ? "active" : ""}
              onClick={() => { setType("Products"); setCategory("All Categories"); }}
            >
              <Icon name="bag" size={17} /> Products
            </button>
            <button
              type="button"
              className={type === "Services" ? "active" : ""}
              onClick={() => { setType("Services"); setCategory("All Categories"); setRegionalOnly(false); }}
            >
              <Icon name="wrench" size={17} /> Services
            </button>
          </div>

          {type === "Products" && (
            <button
              type="button"
              className={`map-row-btn ${regionalOnly ? "active" : ""}`}
              onClick={() => setRegionalOnly((v) => !v)}
            >
              <Icon name="star" size={20} color="#f5a623" fill="#f5a623" />
              <span>Regional Famous</span>
              <Icon name="chevronRight" size={16} color="#888" />
            </button>
          )}

          <button
            type="button"
            className="map-row-btn"
            onClick={locateMe}
            disabled={locating}
          >
            <Icon name="pin" size={20} color="#e53935" fill="#e53935" />
            <span>{locating ? "Locating…" : "Use My Location"}</span>
            <Icon name="chevronRight" size={16} color="#888" />
          </button>
          {locationMsg && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#c62828" }}>{locationMsg}</div>
          )}
        </div>

        <div className="map-filter-section">
          <h4>Category</h4>
          <div className="map-select-wrap">
            <span className="map-select-icon"><Icon name="grid" size={18} color="#555" /></span>
            <select
              className="map-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {currentCategoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <span className="map-select-chevron"><Icon name="chevronDown" size={16} color="#555" /></span>
          </div>
        </div>

        <div className="map-filter-section">
          <h4>Rating</h4>
          {[4.5, 4, 3, 0].map((r) => (
            <label key={r} className="map-rating-option">
              <input
                type="radio"
                name="rating"
                checked={rating === r}
                onChange={() => setRating(r)}
              />
              {r === 0 ? (
                "Any Rating"
              ) : (
                <>
                  <span className="map-rating-num">{r}</span>
                  <Icon name="star" size={16} color="#f5a623" fill="#f5a623" />
                  <span>&amp; above</span>
                </>
              )}
            </label>
          ))}
        </div>

        <div className="map-filter-section">
          <div className="map-distance-head">
            <h4>Distance</h4>
            <span className="map-distance-value">
              {distance >= 20 ? "20 km+" : `${distance} km`}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="map-distance-slider"
            style={{
              background: `linear-gradient(to right, #2d6a4f ${distPct}%, #e3e8e5 ${distPct}%)`,
            }}
          />
          <div className="map-distance-labels">
            <span>1 km</span>
            <span>20 km+</span>
          </div>
        </div>

        <button type="button" className="map-apply-btn" onClick={applyFilters}>
          <Icon name="search" size={20} /> Apply Filters
        </button>
      </aside>

      <div className="map-canvas-wrapper">
        <form className="map-search" onSubmit={handleSearch}>
          <Icon name="search" size={20} color="#555" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search products, services or location..."
          />
        </form>

        <div className="map-toolbar">
          <div className="view-toggle">
            <button
              type="button"
              className={type === "Products" ? "active" : ""}
              onClick={() => { setType("Products"); setCategory("All Categories"); }}
            >
              <Icon name="bag" size={17} /> Products
            </button>
            <button
              type="button"
              className={type === "Services" ? "active" : ""}
              onClick={() => { setType("Services"); setCategory("All Categories"); setRegionalOnly(false); }}
            >
              <Icon name="wrench" size={17} /> Services
            </button>
          </div>
        </div>

        <div ref={mapRef} className="map-canvas" />

        <div className="map-ctrl-stack">
          <div className="map-ctrl-card">
            <button type="button" onClick={() => zoomBy(1)} aria-label="Zoom in">
              <Icon name="plus" size={20} />
            </button>
            <div className="map-ctrl-divider" />
            <button type="button" onClick={() => zoomBy(-1)} aria-label="Zoom out">
              <Icon name="minus" size={20} />
            </button>
          </div>
          <div className="map-ctrl-card">
            <button type="button" onClick={locateMe} aria-label="My location">
              <Icon name="locate" size={22} color="#2d6a4f" />
            </button>
          </div>
        </div>

        <div className="map-ctrl-card map-fs-btn">
          <button type="button" onClick={toggleFullscreen} aria-label="Fullscreen">
            <Icon name="expand" size={20} />
          </button>
        </div>

        {districtTip && (
          <div
            ref={tipRef}
            style={{
              position: "absolute",
              left: districtTip.x + 14,
              top: districtTip.y + 14,
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "6px 10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              fontFamily: "Segoe UI, Arial, sans-serif",
              pointerEvents: "none",
              zIndex: 5,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a" }}>
              {districtTip.name}
            </div>
            <div style={{ fontSize: 11.5, color: "#666" }}>{districtTip.state}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#2d6a4f", marginTop: 2 }}>
              {districtTip.count} seller{districtTip.count === 1 ? "" : "s"}
            </div>
          </div>
        )}

        {showGuide && (
          <div className="map-guide-overlay">
            <div className="map-guide-card">
              <h4>New here? Quick guide 👋</h4>
              <ul>
                <li>🏷️ The colored icons mark a district with a Regional Famous product — click one to zoom in.</li>
                <li>📍 Once zoomed in, each pin is a real nearby seller — hover to preview, click for details.</li>
                <li>🎚️ Use the Filter panel on the left to switch between Products/Services, category, and rating.</li>
              </ul>
              <button onClick={dismissGuide}>Got it</button>
            </div>
          </div>
        )}
      </div>

      {selectedSellerId && sellersByIdRef.current[selectedSellerId] && (
        <SellerMapModal
          seller={sellersByIdRef.current[selectedSellerId]}
          regionalOnly={regionalOnly}
          onClose={() => setSelectedSellerId(null)}
        />
      )}

      {selectedDistrict && (
        <DistrictSellersModal
          districtName={selectedDistrict}
          sellers={sellersByDistrictRef.current[selectedDistrict] || []}
          onViewStore={(sellerId) => {
            setSelectedDistrict(null);
            setSelectedSellerId(sellerId);
          }}
          onClose={() => setSelectedDistrict(null)}
        />
      )}
    </div>
  );
}