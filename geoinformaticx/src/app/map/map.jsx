"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import SellerMapModal from "@/components/SellerMapModal/SellerMapModal";
import DistrictSellersModal from "@/components/DistrictSellersModal/DistrictSellersModal";
import "./map.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const DISTRICT_ZOOM_THRESHOLD = 9;
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

const categoryOptions = {
  Products: ["All Categories", "Handicrafts", "Household", "Pottery", "Food", "Beverages"],
  Services: ["All Categories", "Maid", "Teacher", "Plumber"],
};

export default function MapExplore() {
  const mapRef = useRef(null);
  const [type, setType] = useState("Products");
  const [category, setCategory] = useState("All Categories");
  const [rating, setRating] = useState(0);
  const [distance, setDistance] = useState(20);

  const [liveListings, setLiveListings] = useState([]);
  const [sellers, setSellers] = useState([]);
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
            rating: 4.7,
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
    if (category !== "All Categories" && l.category !== category) return false;
    if (l.rating < rating) return false;
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
      if (!l.regional || !l.district) return;
      if (!grouped[l.district]) grouped[l.district] = [];
      grouped[l.district].push(l);
    });
    regionalByDistrictRef.current = grouped;
  }, [liveListings]);

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
    listings.forEach((item) => {
      if (!item.sellerId || sellersSeen.has(item.sellerId)) return;
      sellersSeen.set(item.sellerId, item);
    });

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

      marker.addListener("mouseover", () => {
        cancelPendingClose();
        infoWindow.setContent(`
          <div id="${popupId}" style="width:190px;font-family:Segoe UI, Arial, sans-serif;">
            <img src="${item.img}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />
            <div style="font-weight:700;font-size:13px;color:#1a1a1a;">${item.seller}</div>
            <div style="font-size:11.5px;color:#888;margin-bottom:8px;">${item.sellerLocation || "Location not set"}</div>
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

  const renderDistrictBoundaries = (map) => {
    const stateLayer = new window.google.maps.Data({ map });
    stateLayer.loadGeoJson("/geo/west-bengal-state.geojson");
    stateLayer.setStyle({
      strokeColor: "#000000",
      strokeWeight: 3,
      strokeOpacity: 1,
      fillOpacity: 0,
      clickable: false,
      zIndex: 1,
    });

    const districtLayer = new window.google.maps.Data({ map });
    districtLayer.loadGeoJson("/geo/west-bengal-districts.geojson");
    districtLayer.setStyle({
      strokeColor: "#000000",
      strokeWeight: 1.2,
      strokeOpacity: 0.8,
      fillOpacity: 0,
      clickable: false,
      zIndex: 1,
    });

    overlaysRef.current.boundaryLayers = [stateLayer, districtLayer];
  };

  const renderDistrictSpecialtyMarkers = (map, infoWindow) => {
    districts.forEach((districtInfo) => {
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
        center: { lat: 23.6, lng: 87.9 },
        zoom: 7,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapObjRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow();

      renderDistrictBoundaries(map);
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
  }, [type, category, rating, distance, liveListings, sellers]);

  return (
    <div className="map-explore-page">
      <aside className="map-filter-panel">
        <h3 className="map-filter-title">Filter</h3>

        <div className="map-filter-section">
          <h4>Type</h4>
          <div className="map-type-toggle">
            <button
              className={type === "Products" ? "active" : ""}
              onClick={() => { setType("Products"); setCategory("All Categories"); }}
            >
              Products
            </button>
            <button
              className={type === "Services" ? "active" : ""}
              onClick={() => { setType("Services"); setCategory("All Categories"); }}
            >
              Services
            </button>
          </div>
        </div>

        <div className="map-filter-section">
          <h4>Category</h4>
          <select
            className="map-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categoryOptions[type].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
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
              {r === 0 ? "Any Rating" : `${r}★ & above`}
            </label>
          ))}
        </div>

        <div className="map-filter-section">
          <h4>Distance</h4>
          <input
            type="range"
            min="1"
            max="20"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="map-distance-slider"
          />
          <div className="map-distance-labels">
            <span>1 km</span>
            <span>{distance >= 20 ? "20 km+" : `${distance} km`}</span>
          </div>
        </div>
      </aside>

      <div className="map-canvas-wrapper">
        <div ref={mapRef} className="map-canvas" />

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