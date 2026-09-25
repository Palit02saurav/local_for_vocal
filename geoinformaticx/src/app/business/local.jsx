"use client";

import Explore from "@/components/explore/explore";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";

function mapProductToBusiness(p) {
  const owner = p.vendor || p.seller;
  let gallery = [];
  try {
    gallery = p.gallery_urls ? JSON.parse(p.gallery_urls) : [];
  } catch {
    gallery = [];
  }
  return {
    id: p.id,
    slug: `product-${p.id}`,
    name: p.name,
    listingType: "Products",
    category: p.category,
    type: p.delivery_type === "Fresh" ? "Fresh Delivery" : "Retail Shop",
    rating: null,
    reviews: 0,
    distance: null,
    address: owner?.location || owner?.address || "",
    img: p.image_url || "",
    images: [p.image_url, ...gallery].filter(Boolean),
    price: p.price,
    unit: p.unit || "",
    lat: owner?.latitude ? Number(owner.latitude) : null,
    lng: owner?.longitude ? Number(owner.longitude) : null,
    deliveryType: p.delivery_type,
    sku: p.sku,
    detailPath: `/shop/${p.sku}`,
    ownerName: owner?.store_name || owner?.full_name || "",
  };
}
import { ALL_LEGEND_CATEGORIES } from "@/lib/categories";
import { addToCart, getCart, updateCartQuantity, removeFromCart } from "@/lib/cart";
import { FaHeart, FaRegHeart, FaExpand, FaMapMarkedAlt, FaThList } from "react-icons/fa";
import "./local.css";

const DEFAULT_CENTER = { lat: 22.5726, lng: 88.3639 }; // Kolkata
const PIN_PATH =
  "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1 1 10,-30 C 10,-22 2,-20 0,0 z";

const CUSTOMER_LOCATION = { lat: 22.480509, lng: 88.3730658 };
const DELIVERY_RADIUS_KM = 3;
const USER_ZOOM = 15;

function haversineDistanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function parseDistanceKm(distance) {
  if (typeof distance === "number") return distance;
  if (!distance) return null;
  const match = String(distance).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
} 



function createCategoryOverlay(position, categories) {
  const overlay = new window.google.maps.OverlayView();
  overlay.position = position;
  overlay.categories = categories;

  overlay.onAdd = function () {
    const div = document.createElement("div");
    div.className = "map-category-overlay";
    div.innerHTML = categories
      .map((cat, i) => {
        const n = categories.length;
        const spread = 70; // degrees the fan covers when there's more than one
        const start = -90 - spread / 2;
        const angleDeg = n === 1 ? -90 : start + (spread / (n - 1)) * i;
        const angle = (angleDeg * Math.PI) / 180;
        const length = 34;
        const dx = Math.cos(angle) * length;
        const dy = Math.sin(angle) * length;
        return `
          <svg class="map-category-line" width="70" height="70" style="left:-35px; top:-35px;">
            <line x1="35" y1="35" x2="${35 + dx}" y2="${35 + dy}" />
          </svg>
          <span class="map-category-chip" style="left:${dx}px; top:${dy}px;">${escapeHtml(cat)}</span>
        `;
      })
      .join("");
    overlay.div = div;
    overlay.getPanes().overlayMouseTarget.appendChild(div);
  };

  overlay.draw = function () {
    const projection = overlay.getProjection();
    if (!projection || !overlay.div) return;
    const point = projection.fromLatLngToDivPixel(
      new window.google.maps.LatLng(overlay.position.lat, overlay.position.lng)
    );
    overlay.div.style.left = point.x + "px";
    overlay.div.style.top = point.y + "px";
  };

  overlay.onRemove = function () {
    if (overlay.div) {
      overlay.div.parentNode.removeChild(overlay.div);
      overlay.div = null;
    }
  };

  return overlay;
}
function loadGoogleMaps(onLoad) {
  if (window.google) {
    onLoad();
    return;
  }
  const existing = document.getElementById("google-maps-script");
  if (existing) {
    existing.addEventListener("load", onLoad);
    return;
  }
  const script = document.createElement("script");
  script.id = "google-maps-script";
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API}`;
  script.async = true;
  script.defer = true;
  script.onload = onLoad;
  document.head.appendChild(script);
}

export default function LocalBusinesses() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const categoryOverlaysRef = useRef([]);
  const userMarkerRef = useRef(null);
  const userInfoRef = useRef(null);
  const zoomedForRef = useRef(null);
  const circleRef = useRef(null);
  const infoWindowRef = useRef(null);
  const addedProductIdsRef = useRef(new Set());

  const [listingType, setListingType] = useState("All"); // "All" | "Products" | "Services"
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [businessType, setBusinessType] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [distanceKm, setDistanceKm] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsBiz, setDetailsBiz] = useState(null);
  const [detailsQty, setDetailsQty] = useState(1);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const syncAddedIds = async () => {
      const items = await getCart();
      addedProductIdsRef.current = new Map(
        items
          .filter((i) => (i.type || "product") === "product")
          .map((i) => [i.id, { cartItemId: i.cartItemId, quantity: i.quantity }])
      );
    };
    syncAddedIds();
    window.addEventListener("storage", syncAddedIds);
    return () => window.removeEventListener("storage", syncAddedIds);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState(null); 
  const [viewMode, setViewMode] = useState("map"); // "map" | "list"
  const [favorites, setFavorites] = useState(new Set());
  const [mapReady, setMapReady] = useState(false);
  const [allBusinesses, setAllBusinesses] = useState([]);
  const [freshCategories, setFreshCategories] = useState([]);


  useEffect(() => {
    api.get("/categories/public?type=fresh")
      .then((res) => {
        const cats = res.data?.data?.categories || res.data?.categories || [];
        setFreshCategories(cats.map((c) => ({ name: c.name })));
      })
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  useEffect(() => {
    api.get("/products/public")
      .then((res) => {
        const products = res.data?.data?.products || res.data?.products || [];
        setAllBusinesses(
          products
            .filter((p) => p.delivery_type === "Fresh" && p.vendor)
            .map(mapProductToBusiness)
            .filter((b) => b.lat && b.lng)
        );
      })
      .catch((err) => console.error("Failed to load public products:", err));
  }, []);

const businessesWithDistance = useMemo(() => {
    const from = userLocation || CUSTOMER_LOCATION;
    return allBusinesses.map((b) => {
      const km = haversineDistanceKm(from, { lat: b.lat, lng: b.lng });
      return { ...b, distanceKmFromUser: km, distance: `${km.toFixed(1)} km` };
    });
  }, [allBusinesses, userLocation]);

  const filteredBusinesses = useMemo(() => {
    return businessesWithDistance.filter((b) => {
      if (listingType !== "All" && b.listingType !== listingType) return false;
      if (selectedCategory !== "All" && b.category !== selectedCategory) return false;
      if (businessType !== "All" && b.type && b.type !== businessType) return false;
      if (minRating && b.rating && b.rating < minRating) return false;

      if (b.distanceKmFromUser > distanceKm) return false;
      if (
        searchQuery &&
        !`${b.name} ${b.category} ${b.ownerName || ""} ${b.address || ""}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [businessesWithDistance, listingType, selectedCategory, businessType, minRating, distanceKm, searchQuery]);

  function toggleFavorite(slug) {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  function handleLocate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCenter(here);
      setUserLocation(here);
    });
  }
 useEffect(() => {
    handleLocate();
  }, []);
  function handleFullscreen() {
    if (!mapContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      mapContainerRef.current.requestFullscreen?.();
    }
  }

  // Init the map ONCE (and re-center/redraw the radius circle when the user
  // location or distance filter changes) — this never rebuilds the map itself.
  useEffect(() => {
    if (viewMode !== "map") return;

    loadGoogleMaps(() => {
      if (!mapRef.current || !window.google) return;

      if (!mapInstance.current) {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        infoWindowRef.current = new window.google.maps.InfoWindow();
      } else {
        mapInstance.current.setCenter(center);
      }

      if (userMarkerRef.current) userMarkerRef.current.setMap(null);
      userMarkerRef.current = userLocation && new window.google.maps.Marker({
        position: userLocation,
        map: mapInstance.current,
        // title: "Your location",
        zIndex: 1000, 
      });

      if (userLocation && zoomedForRef.current !== userLocation) {
        mapInstance.current.setZoom(USER_ZOOM);
        zoomedForRef.current = userLocation;
      }
      const userMarker = userMarkerRef.current;
      if (userMarker) {
        if (!userInfoRef.current) {
          userInfoRef.current = new window.google.maps.InfoWindow({
            disableAutoPan: true,
            headerDisabled: true,
          });
        }
        userInfoRef.current.setContent(`
          <div class="user-loc-tip">
            <span class="user-loc-dot"></span>
            <div>
              <div class="user-loc-title">Your Location</div>
              <div class="user-loc-sub">Detected from your device</div>
            </div>
          </div>
        `);
        userMarker.addListener("mouseover", () =>
          userInfoRef.current.open(mapInstance.current, userMarker)
        );
        userMarker.addListener("mouseout", () => userInfoRef.current.close());
      }

      if (circleRef.current) circleRef.current.setMap(null);
      circleRef.current = userLocation && new window.google.maps.Circle({
        map: mapInstance.current,
        center: userLocation,
        radius: distanceKm * 1000,
        fillColor: "#ea4335",
        fillOpacity: 0,
        strokeColor: "#ea4335",
        strokeOpacity: 0.3,
        strokeWeight: 1,
      });

      setMapReady(true);
    });
  }, [viewMode, center, distanceKm, userLocation]);

  //   useEffect(() => {
  //   handleLocate();
  // }, []);

  // Re-sync the business pins every time the filtered list changes.
  // This is the effect that makes every filter visibly change the pins on
  // the map, without ever tearing down and rebuilding the whole map.
  // useEffect(() => {
  //   if (viewMode !== "map" || !mapReady || !mapInstance.current || !window.google) return;

  //   markersRef.current.forEach((m) => m.setMap(null));

  //   markersRef.current = filteredBusinesses.map((biz) => {
  //     const marker = new window.google.maps.Marker({
  //       position: { lat: biz.lat, lng: biz.lng },
  //       map: mapInstance.current,
  //       title: biz.name,
  //       icon: {
  //         path: window.google.maps.SymbolPath.CIRCLE,
  //         scale: 8,
  //         fillColor: "#4a90d9",
  //         fillOpacity: 1,
  //         strokeColor: "#ffffff",
  //         strokeWeight: 2,
  //       },
  //     });

  //     let closeTimeout = null;

  //     marker.addListener("mouseover", () => {
  //       if (closeTimeout) {
  //         clearTimeout(closeTimeout);
  //         closeTimeout = null;
  //       }

  //       const infoWindow = infoWindowRef.current;
  //       const distanceFromYou = haversineDistanceKm(CUSTOMER_LOCATION, {
  //         lat: biz.lat,
  //         lng: biz.lng,
  //       });
  //       const isEligible = distanceFromYou <= DELIVERY_RADIUS_KM;

  //       infoWindow.setContent(`
  //         <div class="map-info-card">
  //           <img class="map-info-img" src="${biz.img}" alt="${biz.name}" />
  //           <div class="map-info-body">
  //             <div class="map-info-name">${escapeHtml(biz.name)}</div>
  //             <div class="map-info-category">${escapeHtml(biz.category)}</div>
  //             ${biz.ownerName ? `<div class="map-info-category">By ${escapeHtml(biz.ownerName)}</div>` : ""}
  //             <div class="map-info-rating">⭐ ${biz.rating ?? "—"} (${biz.reviews ?? 0})</div>
  //             <div class="map-info-address">📍 ${escapeHtml(biz.address || biz.distance || "")}</div>
  //             <div class="map-info-distance">${biz.distance ? biz.distance + " away" : ""}</div>
  //             <div class="map-info-delivery">
  //               <button class="map-info-delivery-btn" id="check-delivery-${biz.slug}">🛵 Check 10-Min Delivery</button>
  //               <div class="map-info-delivery-result" id="delivery-result-${biz.slug}"></div>
  //               <button class="map-info-add-cart-btn" id="add-cart-${biz.slug}" style="display:none;">🛒 Add to Cart (10-Min Delivery)</button>
  //             </div>
  //             <button class="map-info-btn" id="view-details-${biz.slug}">View Details</button>
  //           </div>
  //         </div>
  //       `);
  //       infoWindow.open(mapInstance.current, marker);

  //       window.google.maps.event.addListenerOnce(infoWindow, "domready", () => {
  //         const viewBtn = document.getElementById(`view-details-${biz.slug}`);
  //         if (viewBtn) {
  //           viewBtn.addEventListener("click", () => {
  //             window.location.href = biz.detailPath || `/business/${biz.slug}`;
  //           });
  //         }

  //         const deliveryBtn = document.getElementById(`check-delivery-${biz.slug}`);
  //         const resultEl = document.getElementById(`delivery-result-${biz.slug}`);
  //         const addCartBtn = document.getElementById(`add-cart-${biz.slug}`);

  //         if (deliveryBtn && resultEl) {
  //           deliveryBtn.addEventListener("click", () => {
  //             if (isEligible) {
  //               resultEl.innerHTML = `✅ 10-Min Delivery available (${distanceFromYou.toFixed(1)} km away)`;
  //               resultEl.className = "map-info-delivery-result eligible";
  //               if (addCartBtn) addCartBtn.style.display = "block";
  //             } else {
  //               resultEl.innerHTML = `❌ Not available — you're ${distanceFromYou.toFixed(1)} km away (limit: ${DELIVERY_RADIUS_KM} km)`;
  //               resultEl.className = "map-info-delivery-result not-eligible";
  //               if (addCartBtn) addCartBtn.style.display = "none";
  //             }
  //           });
  //         }

  //         if (addCartBtn) {
  //           addCartBtn.addEventListener("click", () => {
  //             addToCart(
  //               {
  //                 id: `${biz.slug}-10min`,
  //                 name: biz.name,
  //                 seller: biz.name,
  //                 verified: biz.verified,
  //                 price: 0,
  //                 image: biz.img,
  //                 type: "10min-delivery",
  //               },
  //               1
  //             );
  //             addCartBtn.textContent = "✓ Added to Cart";
  //             addCartBtn.disabled = true;
  //           });
  //         }

  //         const cardEl = document.querySelector(".map-info-card");
  //         const bubbleEl = cardEl?.closest(".gm-style-iw");
  //         if (bubbleEl) {
  //           bubbleEl.addEventListener("mouseenter", () => {
  //             if (closeTimeout) {
  //               clearTimeout(closeTimeout);
  //               closeTimeout = null;
  //             }
  //           });
  //           bubbleEl.addEventListener("mouseleave", () => {
  //             closeTimeout = setTimeout(() => {
  //               infoWindowRef.current?.close();
  //             }, 150);
  //           });
  //         }
  //       });
  //     });

  //     marker.addListener("mouseout", () => {
  //       closeTimeout = setTimeout(() => {
  //         infoWindowRef.current?.close();
  //       }, 250);
  //     });
  //     marker.addListener("click", () => {
  //       window.location.href = biz.detailPath || `/business/${biz.slug}`;
  //     });

  //     return marker;
  //   });

  //   return () => {
  //     markersRef.current.forEach((m) => m.setMap(null));
  //   };
  // }, [filteredBusinesses, viewMode, mapReady]);


    // useEffect(() => {
    // if (viewMode !== "map" || !mapReady || !mapInstance.current || !window.google) return;

    // markersRef.current.forEach((m) => m.setMap(null));

    // const openInfoWindow = (biz, marker, closeTimeoutSetter) => {
    //   const infoWindow = infoWindowRef.current;
    //   const distanceFromYou = haversineDistanceKm(CUSTOMER_LOCATION, {
    //     lat: biz.lat,
    //     lng: biz.lng,
    //   });
    //   const isEligible = distanceFromYou <= DELIVERY_RADIUS_KM;

    //   infoWindow.setContent(`
    //     <div class="map-info-card">
    //       <img class="map-info-img" src="${biz.img}" alt="${biz.name}" />
    //       <div class="map-info-body">
    //         <div class="map-info-name">${escapeHtml(biz.name)}</div>
    //         <div class="map-info-category">${escapeHtml(biz.category)}</div>
    //         ${biz.ownerName ? `<div class="map-info-category">By ${escapeHtml(biz.ownerName)}</div>` : ""}
    //         <div class="map-info-rating">⭐ ${biz.rating ?? "—"} (${biz.reviews ?? 0})</div>
    //         <div class="map-info-address">📍 ${escapeHtml(biz.address || biz.distance || "")}</div>
    //         <div class="map-info-distance">${biz.distance ? biz.distance + " away" : ""}</div>
    //         <div class="map-info-delivery">
    //           <button class="map-info-delivery-btn" id="check-delivery-${biz.slug}">🛵 Check 10-Min Delivery</button>
    //           <div class="map-info-delivery-result" id="delivery-result-${biz.slug}"></div>
    //           <button class="map-info-add-cart-btn" id="add-cart-${biz.slug}" style="display:none;">🛒 Add to Cart (10-Min Delivery)</button>
    //         </div>
    //         <button class="map-info-btn" id="view-details-${biz.slug}">View Details</button>
    //       </div>
    //     </div>
    //   `);
    //   infoWindow.open(mapInstance.current, marker);

    //   window.google.maps.event.addListenerOnce(infoWindow, "domready", () => {
    //     const viewBtn = document.getElementById(`view-details-${biz.slug}`);
    //     if (viewBtn) {
    //       viewBtn.addEventListener("click", () => {
    //         window.location.href = biz.detailPath || `/business/${biz.slug}`;
    //       });
    //     }

    //     const deliveryBtn = document.getElementById(`check-delivery-${biz.slug}`);
    //     const resultEl = document.getElementById(`delivery-result-${biz.slug}`);
    //     const addCartBtn = document.getElementById(`add-cart-${biz.slug}`);

    //     if (deliveryBtn && resultEl) {
    //       deliveryBtn.addEventListener("click", () => {
    //         if (isEligible) {
    //           resultEl.innerHTML = `✅ 10-Min Delivery available (${distanceFromYou.toFixed(1)} km away)`;
    //           resultEl.className = "map-info-delivery-result eligible";
    //           if (addCartBtn) addCartBtn.style.display = "block";
    //         } else {
    //           resultEl.innerHTML = `❌ Not available — you're ${distanceFromYou.toFixed(1)} km away (limit: ${DELIVERY_RADIUS_KM} km)`;
    //           resultEl.className = "map-info-delivery-result not-eligible";
    //           if (addCartBtn) addCartBtn.style.display = "none";
    //         }
    //       });
    //     }

    //     if (addCartBtn) {
    //       addCartBtn.addEventListener("click", () => {
    //         addToCart(
    //           {
    //             id: `${biz.slug}-10min`,
    //             name: biz.name,
    //             seller: biz.name,
    //             verified: biz.verified,
    //             price: 0,
    //             image: biz.img,
    //             type: "10min-delivery",
    //           },
    //           1
    //         );
    //         addCartBtn.textContent = "✓ Added to Cart";
    //         addCartBtn.disabled = true;
    //       });
    //     }

    //     const cardEl = document.querySelector(".map-info-card");
    //     const bubbleEl = cardEl?.closest(".gm-style-iw");
    //     if (bubbleEl && closeTimeoutSetter) {
    //       bubbleEl.addEventListener("mouseenter", () => closeTimeoutSetter(null));
    //       bubbleEl.addEventListener("mouseleave", () => {
    //         closeTimeoutSetter(
    //           setTimeout(() => infoWindowRef.current?.close(), 150)
    //         );
    //       });
    //     }
    //   });
    // };

    // markersRef.current = filteredBusinesses.map((biz) => {


  //       function openInfoWindow(biz, marker, closeTimeoutSetter) {
  //   if (!mapInstance.current || !window.google) return;
  //   const infoWindow = infoWindowRef.current;
  //   const distanceFromYou = haversineDistanceKm(CUSTOMER_LOCATION, {
  //     lat: biz.lat,
  //     lng: biz.lng,
  //   });
  //   const isEligible = distanceFromYou <= DELIVERY_RADIUS_KM;

  //   infoWindow.setContent(`
  //     <div class="map-info-card">
  //       <img class="map-info-img" src="${biz.img}" alt="${biz.name}" />
  //       <div class="map-info-body">
  //         <div class="map-info-name">${escapeHtml(biz.name)}</div>
  //         <div class="map-info-category">${escapeHtml(biz.category)}</div>
  //         ${biz.ownerName ? `<div class="map-info-category">By ${escapeHtml(biz.ownerName)}</div>` : ""}
  //         <div class="map-info-rating">⭐ ${biz.rating ?? "—"} (${biz.reviews ?? 0})</div>
  //         <div class="map-info-address">📍 ${escapeHtml(biz.address || biz.distance || "")}</div>
  //         <div class="map-info-distance">${biz.distance ? biz.distance + " away" : ""}</div>
  //         <div class="map-info-delivery">
  //           <button class="map-info-delivery-btn" id="check-delivery-${biz.slug}">🛵 Check 10-Min Delivery</button>
  //           <div class="map-info-delivery-result" id="delivery-result-${biz.slug}"></div>
  //           <button class="map-info-add-cart-btn" id="add-cart-${biz.slug}" style="display:none;">🛒 Add to Cart (10-Min Delivery)</button>
  //         </div>
  //         <button class="map-info-btn" id="view-details-${biz.slug}">View Details</button>
  //       </div>
  //     </div>
  //   `);
  //   infoWindow.open(mapInstance.current, marker);

  //   window.google.maps.event.addListenerOnce(infoWindow, "domready", () => {
  //     const viewBtn = document.getElementById(`view-details-${biz.slug}`);
  //     if (viewBtn) {
  //       viewBtn.addEventListener("click", () => {
  //         window.location.href = biz.detailPath || `/business/${biz.slug}`;
  //       });
  //     }

  //     const deliveryBtn = document.getElementById(`check-delivery-${biz.slug}`);
  //     const resultEl = document.getElementById(`delivery-result-${biz.slug}`);
  //     const addCartBtn = document.getElementById(`add-cart-${biz.slug}`);

  //     if (deliveryBtn && resultEl) {
  //       deliveryBtn.addEventListener("click", () => {
  //         if (isEligible) {
  //           resultEl.innerHTML = `✅ 10-Min Delivery available (${distanceFromYou.toFixed(1)} km away)`;
  //           resultEl.className = "map-info-delivery-result eligible";
  //           if (addCartBtn) addCartBtn.style.display = "block";
  //         } else {
  //           resultEl.innerHTML = `❌ Not available — you're ${distanceFromYou.toFixed(1)} km away (limit: ${DELIVERY_RADIUS_KM} km)`;
  //           resultEl.className = "map-info-delivery-result not-eligible";
  //           if (addCartBtn) addCartBtn.style.display = "none";
  //         }
  //       });
  //     }

  //     if (addCartBtn) {
  //       addCartBtn.addEventListener("click", () => {
  //         addToCart(
  //           {
  //             id: `${biz.slug}-10min`,
  //             name: biz.name,
  //             seller: biz.name,
  //             verified: biz.verified,
  //             price: 0,
  //             image: biz.img,
  //             type: "10min-delivery",
  //           },
  //           1
  //         );
  //         addCartBtn.textContent = "✓ Added to Cart";
  //         addCartBtn.disabled = true;
  //       });
  //     }

  //     const cardEl = document.querySelector(".map-info-card");
  //     const bubbleEl = cardEl?.closest(".gm-style-iw");
  //     if (bubbleEl && closeTimeoutSetter) {
  //       bubbleEl.addEventListener("mouseenter", () => closeTimeoutSetter(null));
  //       bubbleEl.addEventListener("mouseleave", () => {
  //         closeTimeoutSetter(
  //           setTimeout(() => infoWindowRef.current?.close(), 150)
  //         );
  //       });
  //     }
  //   });
  // }


          function openInfoWindow(biz, marker, closeTimeoutSetter) {
    if (!mapInstance.current || !window.google) return;
    const infoWindow = infoWindowRef.current;

    infoWindow.setContent(`
      <div class="map-info-card">
        <button class="map-info-close" id="close-info-${biz.slug}" aria-label="Close">×</button>
        <img class="map-info-img" src="${biz.img}" alt="${biz.name}" />
        <div class="map-info-body">
          <div class="map-info-meta-row">
            <span class="map-info-name">${escapeHtml(biz.name)}</span>
            <span class="map-info-category">${escapeHtml(biz.category)}</span>
            ${biz.ownerName ? `<span class="map-info-category">By ${escapeHtml(biz.ownerName)}</span>` : ""}
            <span class="map-info-rating">⭐ ${biz.rating ?? "—"} (${biz.reviews ?? 0})</span>
          </div>  
          <div class="map-info-address">📍 ${escapeHtml(biz.address || biz.distance || "")}</div>
          <div class="map-info-distance">${biz.distance ? biz.distance + " away" : ""}</div>
          <div class="map-info-actions">
            ${
              addedProductIdsRef.current.has(biz.id)
                ? `
                  <div class="map-info-qty-stepper" id="qty-stepper-${biz.slug}">
                    <button class="map-info-qty-btn" id="qty-minus-${biz.slug}">−</button>
                    <span class="map-info-qty-value">${addedProductIdsRef.current.get(biz.id).quantity}</span>
                    <button class="map-info-qty-btn" id="qty-plus-${biz.slug}">+</button>
                  </div>
                  <button class="map-info-remove-btn" id="remove-cart-${biz.slug}" aria-label="Remove">🗑</button>
                `
                : `<button class="map-info-add-cart-btn" id="add-cart-${biz.slug}">Add to Cart</button>`
            }
            <button class="map-info-btn" id="view-details-${biz.slug}">View Details</button>
          </div>
        </div>
      </div>
    `);
    infoWindow.open(mapInstance.current, marker);

    window.google.maps.event.addListenerOnce(infoWindow, "domready", () => {
      const closeBtn = document.getElementById(`close-info-${biz.slug}`);
      if (closeBtn) {
        closeBtn.addEventListener("click", () => infoWindowRef.current?.close());
      }

      const viewBtn = document.getElementById(`view-details-${biz.slug}`);
      if (viewBtn) {
        viewBtn.addEventListener("click", () => {
          setDetailsBiz(biz);
          setDetailsQty(1);
          setActiveImgIdx(0);
          infoWindowRef.current?.close();
        });
      }

      const cartEntry = addedProductIdsRef.current.get(biz.id);

      if (cartEntry) {
        document.getElementById(`qty-minus-${biz.slug}`)?.addEventListener("click", async () => {
          if (cartEntry.quantity <= 1) {
            await removeFromCart(cartEntry.cartItemId);
            addedProductIdsRef.current.delete(biz.id);
          } else {
            await updateCartQuantity(cartEntry.cartItemId, cartEntry.quantity - 1);
            addedProductIdsRef.current.set(biz.id, { ...cartEntry, quantity: cartEntry.quantity - 1 });
          }
          openInfoWindow(biz, marker, closeTimeoutSetter);
        });

        document.getElementById(`qty-plus-${biz.slug}`)?.addEventListener("click", async () => {
          await updateCartQuantity(cartEntry.cartItemId, cartEntry.quantity + 1);
          addedProductIdsRef.current.set(biz.id, { ...cartEntry, quantity: cartEntry.quantity + 1 });
          openInfoWindow(biz, marker, closeTimeoutSetter);
        });

        document.getElementById(`remove-cart-${biz.slug}`)?.addEventListener("click", async () => {
          await removeFromCart(cartEntry.cartItemId);
          addedProductIdsRef.current.delete(biz.id);
          openInfoWindow(biz, marker, closeTimeoutSetter);
        });
      } else {
        const addCartBtn = document.getElementById(`add-cart-${biz.slug}`);
        if (addCartBtn) {
          addCartBtn.addEventListener("click", async () => {
            const result = await addToCart({ productId: biz.id, type: "product" });
            if (!result.success) {
              addCartBtn.textContent = result.requiresLogin ? "Please log in" : "Failed";
              return;
            }
            const items = await getCart();
            const match = items.find((i) => i.id === biz.id && (i.type || "product") === "product");
            addedProductIdsRef.current.set(biz.id, {
              cartItemId: match?.cartItemId,
              quantity: match?.quantity || 1,
            });
            openInfoWindow(biz, marker, closeTimeoutSetter);
          });
        }
      }

      const cardEl = document.querySelector(".map-info-card");
      const bubbleEl = cardEl?.closest(".gm-style-iw");
      if (bubbleEl && closeTimeoutSetter) {
        bubbleEl.addEventListener("mouseenter", () => closeTimeoutSetter(null));
        bubbleEl.addEventListener("mouseleave", () => {
          closeTimeoutSetter(
            setTimeout(() => infoWindowRef.current?.close(), 150)
          );
        });
      }
    });
  }

  useEffect(() => {
    if (viewMode !== "map" || !mapReady || !mapInstance.current || !window.google) return;

    markersRef.current.forEach((m) => m.setMap(null));
    categoryOverlaysRef.current.forEach((o) => o.setMap(null));
    categoryOverlaysRef.current = [];

    const locationGroups = new Map();
    filteredBusinesses.forEach((biz) => {
      const key = `${biz.lat.toFixed(5)},${biz.lng.toFixed(5)}`;
      if (!locationGroups.has(key)) {
        locationGroups.set(key, { lat: biz.lat, lng: biz.lng, categories: new Set() });
      }
      locationGroups.get(key).categories.add(biz.category);
    });

    categoryOverlaysRef.current = Array.from(locationGroups.values()).map((group) => {
      const overlay = createCategoryOverlay(
        { lat: group.lat, lng: group.lng },
        Array.from(group.categories)
      );
      overlay.setMap(mapInstance.current);
      return overlay;
    });

    markersRef.current = filteredBusinesses.map((biz) => {
      const marker = new window.google.maps.Marker({
        position: { lat: biz.lat, lng: biz.lng },
        map: mapInstance.current,
        title: biz.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4a90d9",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      let closeTimeout = null;
      const setCloseTimeout = (t) => {
        if (closeTimeout) clearTimeout(closeTimeout);
        closeTimeout = t;
      };

      marker.addListener("mouseover", () => {
        setCloseTimeout(null);
        openInfoWindow(biz, marker, setCloseTimeout);
      });

      marker.addListener("mouseout", () => {
        setCloseTimeout(setTimeout(() => infoWindowRef.current?.close(), 250));
      });
      marker.addListener("click", () => {
        window.location.href = biz.detailPath || `/business/${biz.slug}`;
      });

      return marker;
    });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      categoryOverlaysRef.current.forEach((o) => o.setMap(null));
      categoryOverlaysRef.current = [];
    };
  }, [filteredBusinesses, viewMode, mapReady]);


  useEffect(() => {
    if (viewMode !== "map" || !mapReady || !mapInstance.current || !window.google) return;
    if (!markersRef.current.length || !filteredBusinesses.length) return;

    const searchSettled = searchQuery.trim() === debouncedSearch;

    const filtersApplied =
      selectedCategory !== "All" ||
      minRating > 0 ||
      debouncedSearch !== "";

    if (!searchSettled || !filtersApplied) return;

    const match = filteredBusinesses[0];
    const marker = markersRef.current[0];
    openInfoWindow(match, marker);

    if (debouncedSearch !== "") {
      mapInstance.current.panTo({ lat: match.lat, lng: match.lng });
      if (mapInstance.current.getZoom() < USER_ZOOM) {
        mapInstance.current.setZoom(USER_ZOOM);
      }
    }
  }, [filteredBusinesses, debouncedSearch, searchQuery, selectedCategory, minRating, distanceKm, mapReady, viewMode]);

  return (
    <div className="local-page">
      <aside className="local-sidebar">
        <Explore
          listingType={listingType}
          setListingType={setListingType}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={freshCategories}
          businessType={businessType}
          setBusinessType={setBusinessType}
          minRating={minRating}
          setMinRating={setMinRating}
          distanceKm={distanceKm}
          setDistanceKm={setDistanceKm}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onLocate={handleLocate}
        />
      </aside>

      <div className="local-main" ref={mapContainerRef}>
        <div className="map-toolbar">
          <div className="view-toggle">
            <button
              type="button"
              className={viewMode === "map" ? "active" : ""}
              onClick={() => setViewMode("map")}
            >
              <FaMapMarkedAlt /> Map View
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
            >
              <FaThList /> List View
            </button>
          </div>
          <button
            type="button"
            className="fullscreen-btn"
            onClick={handleFullscreen}
            aria-label="Toggle fullscreen"
          >
            <FaExpand />
          </button>
        </div>

        {viewMode === "map" ? (
          <div ref={mapRef} className="local-map" />
        ) : (
          <div className="local-list">
            {filteredBusinesses.map((biz) => (
              <Link key={biz.slug} href={biz.detailPath || `/business/${biz.slug}`} className="list-row">
                <img src={biz.img} alt={biz.name} />
                <div>
                  <p className="list-name">{biz.name}</p>
                  <p className="list-type">{biz.category}</p>
                  <span className="list-meta">
                    ⭐ {biz.rating} ({biz.reviews}) · 📍 {biz.distance}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="local-bottom">
        <div>
          <div className="nearby-header">
            <span className="nearby-title">Nearby Businesses</span>
            <Link href="#" className="nearby-view-all">View All →</Link>
          </div>
          <div className="nearby-cards">
            {filteredBusinesses.slice(0, 3).map((biz) => (
              <div key={biz.slug} className="nearby-card">
                <button
                  type="button"
                  className="nearby-fav"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(biz.slug);
                  }}
                  aria-label="Save business"
                >
                  {favorites.has(biz.slug) ? <FaHeart color="#e63946" /> : <FaRegHeart />}
                </button>
                <Link href={biz.detailPath || `/business/${biz.slug}`} className="nearby-card-link">
                  <div className="nearby-img-wrapper">
                    <img src={biz.img} alt={biz.name} className="nearby-img" />
                  </div>
                  <div className="nearby-info">
                    <p className="nearby-name">{biz.name}</p>
                    <p className="nearby-type">{biz.category}</p>
                    <div className="nearby-meta">
                      <span className="nearby-rating">⭐ {biz.rating} ({biz.reviews})</span>
                      <span className="nearby-distance">📍 {biz.distance}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="local-legend-card">
          <p className="legend-title">Legend</p>
          <div className="legend-list">
            {ALL_LEGEND_CATEGORIES.map((c) => (
              <div className="legend-item" key={c.name}>
                <span className="legend-dot" style={{ background: c.color }} />
                <span className="legend-label">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="local-support-card">
          <p className="support-title">Support Local, Grow Together</p>
          <p className="support-desc">
            Every visit and purchase helps small local businesses thrive in your community.
          </p>
          <div className="support-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        </div>
      </div>


            {detailsBiz && (
        <div className="business-detail-modal-overlay" onClick={() => setDetailsBiz(null)}>
          <div className="business-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-main-img-wrap">
              <button className="business-detail-close" onClick={() => setDetailsBiz(null)}>×</button>
              <img
                className="pd-main-img"
                src={detailsBiz.images?.[activeImgIdx] || detailsBiz.img}
                alt={detailsBiz.name}
              />
              <button className="pd-wishlist-btn"><FaRegHeart /></button>
              {detailsBiz.images?.length > 1 && (
                <span className="pd-img-counter">{activeImgIdx + 1} / {detailsBiz.images.length}</span>
              )}
            </div>

            {detailsBiz.images?.length > 1 && (
              <div className="pd-thumb-row">
                {detailsBiz.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className={`pd-thumb ${i === activeImgIdx ? "active" : ""}`}
                    onClick={() => setActiveImgIdx(i)}
                  />
                ))}
              </div>
            )}

            <div className="business-detail-body">
              <div className="pd-title-row">
                <h3 className="business-detail-name">{detailsBiz.name}</h3>
                {detailsBiz.rating != null && (
                  <span className="pd-rating">⭐ {detailsBiz.rating} <span className="pd-reviews">({detailsBiz.reviews} reviews)</span></span>
                )}
              </div>

              <p className="business-detail-location">
                📍 {detailsBiz.address || detailsBiz.distance || ""}
              </p>

              {detailsBiz.category?.toLowerCase() === "vegetables" && (
                <div className="pd-feature-row pd-feature-row--veg">
                  <div className="pd-feature-item pd-feature-item--veg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 16c0-7 5-11 15-11 0 9-4 13-11 13-1.8 0-3-.6-4-1.6" />
                      <path d="M6 18l9-9" />
                    </svg>
                    Farm Fresh
                  </div>
                  <div className="pd-feature-item pd-feature-item--veg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    Pesticide Free
                  </div>
                  <div className="pd-feature-item pd-feature-item--veg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 16c0-7 5-11 15-11 0 9-4 13-11 13-1.8 0-3-.6-4-1.6" />
                      <path d="M6 18l9-9" />
                    </svg>
                    Rich in Nutrition
                  </div>
                  <div className="pd-feature-item pd-feature-item--veg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2.5" y="9" width="11" height="7" rx="1" />
                      <path d="M13.5 11.5H17l3 2.5V16h-2" />
                      <circle cx="7" cy="17.5" r="1.5" />
                      <circle cx="16.5" cy="17.5" r="1.5" />
                    </svg>
                    Daily Supply
                  </div>
                </div>
              )}

              {detailsBiz.category?.toLowerCase() === "fruits" && (
                <div className="pd-feature-row pd-feature-row--fruit">
                  <div className="pd-feature-item pd-feature-item--fruit">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="13.5" r="7" />
                      <path d="M12 6.5c0-1.5 1-2.5 2.2-3" />
                      <path d="M9.5 4c.8-.6 2-.6 2.5 0" />
                    </svg>
                    Naturally Ripe
                  </div>
                  <div className="pd-feature-item pd-feature-item--fruit">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    Chemical Free
                  </div>
                  <div className="pd-feature-item pd-feature-item--fruit">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 16c0-7 5-11 15-11 0 9-4 13-11 13-1.8 0-3-.6-4-1.6" />
                      <path d="M6 18l9-9" />
                    </svg>
                    Rich in Vitamins
                  </div>
                  <div className="pd-feature-item pd-feature-item--fruit">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2.5" y="9" width="11" height="7" rx="1" />
                      <path d="M13.5 11.5H17l3 2.5V16h-2" />
                      <circle cx="7" cy="17.5" r="1.5" />
                      <circle cx="16.5" cy="17.5" r="1.5" />
                    </svg>
                    Fresh Delivery
                  </div>
                </div>
              )}

              {detailsBiz.category?.toLowerCase() === "fish" && (
                <div className="pd-feature-row pd-feature-row--fish">
                  <div className="pd-feature-item pd-feature-item--fish">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12c3-4 7-6 11-6 3 0 5.5 2 7 6-1.5 4-4 6-7 6-4 0-8-2-11-6z" />
                      <path d="M21 12l-3-2v4l3-2z" />
                      <circle cx="8" cy="11" r=".6" fill="currentColor" stroke="none" />
                    </svg>
                    Fresh Catch
                  </div>
                  <div className="pd-feature-item pd-feature-item--fish">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    Hygienically Cleaned
                  </div>
                  <div className="pd-feature-item pd-feature-item--fish">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M12 2l-2.5 2.5M12 2l2.5 2.5M12 22l-2.5-2.5M12 22l2.5-2.5" />
                      <path d="M3.5 7l17 10M3.5 7L6 7.5M3.5 7L4 9.5M20.5 17L18 16.5M20.5 17L20 14.5" />
                      <path d="M20.5 7l-17 10M20.5 7L18 7.5M20.5 7L20 9.5M3.5 17L6 16.5M3.5 17L4 14.5" />
                    </svg>
                    Properly Stored
                  </div>
                  <div className="pd-feature-item pd-feature-item--fish">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2.5" y="9" width="11" height="7" rx="1" />
                      <path d="M13.5 11.5H17l3 2.5V16h-2" />
                      <circle cx="7" cy="17.5" r="1.5" />
                      <circle cx="16.5" cy="17.5" r="1.5" />
                    </svg>
                    Same Day Delivery
                  </div>
                </div>
              )}

              {detailsBiz.category?.toLowerCase() === "milk" && (
                <div className="pd-feature-row">
                  <div className="pd-feature-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2c-3.5 5-6 8.6-6 11.5a6 6 0 0 0 12 0C18 10.6 15.5 7 12 2z" />
                    </svg>
                    A2 Milk
                  </div>
                  <div className="pd-feature-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 15-9 0 11-4 15-9 15z" />
                      <path d="M4 20c3.5-6 6-9.5 11-13" />
                    </svg>
                    Rich Nutrition
                  </div>
                  <div className="pd-feature-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    Hygienically Packed
                  </div>
                  <div className="pd-feature-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 8c-1.5-1-3-.5-3 1s1.5 2 2.5 1.5" />
                      <path d="M17 8c1.5-1 3-.5 3 1s-1.5 2-2.5 1.5" />
                      <path d="M8 9c0-2 1.8-4 4-4s4 2 4 4v3c0 3-1.8 6-4 7-2.2-1-4-4-4-7V9z" />
                      <circle cx="10.3" cy="11.5" r=".6" fill="currentColor" stroke="none" />
                      <circle cx="13.7" cy="11.5" r=".6" fill="currentColor" stroke="none" />
                      <path d="M11 13.5c.5.4 1.5.4 2 0" />
                    </svg>
                    Pure Buffalo Milk
                  </div>
                </div>
              )}

              <div className="pd-price-row">
                <div>
                  <span className="pd-price">₹{Number(detailsBiz.price || 0).toLocaleString("en-IN")}</span>
                  {detailsBiz.unit && <span className="pd-unit">{detailsBiz.unit}</span>}
                  <p className="pd-tax-note">Inclusive of all taxes</p>
                </div>
                <div className="pd-qty-stepper">
                  <button onClick={() => setDetailsQty((q) => Math.max(1, q - 1))}>−</button>
                  <span>{detailsQty}</span>
                  <button onClick={() => setDetailsQty((q) => q + 1)}>+</button>
                </div>
              </div>

              <div className="pd-action-row">
                <button
                  className="pd-add-cart-btn"
                  onClick={() => addToCart({ productId: detailsBiz.id, type: "product", quantity: detailsQty })}
                >
                  🛒 Add to Cart
                </button>
                <button className="pd-buy-now-btn">Buy Now</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* {detailsBiz && (
        <div className="business-detail-modal-overlay" onClick={() => setDetailsBiz(null)}>
          <div className="business-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="business-detail-close" onClick={() => setDetailsBiz(null)}>×</button>

            <div className="pd-main-img-wrap">
              <img
                className="pd-main-img"
                src={detailsBiz.images?.[activeImgIdx] || detailsBiz.img}
                alt={detailsBiz.name}
              />
              <button className="pd-wishlist-btn"><FaRegHeart /></button>
              {detailsBiz.images?.length > 1 && (
                <span className="pd-img-counter">{activeImgIdx + 1} / {detailsBiz.images.length}</span>
              )}
            </div>

            {detailsBiz.images?.length > 1 && (
              <div className="pd-thumb-row">
                {detailsBiz.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className={`pd-thumb ${i === activeImgIdx ? "active" : ""}`}
                    onClick={() => setActiveImgIdx(i)}
                  />
                ))}
              </div>
            )}

            <div className="business-detail-body">
              <div className="pd-title-row">
                <h3 className="business-detail-name">{detailsBiz.name}</h3>
                {detailsBiz.rating != null && (
                  <span className="pd-rating">⭐ {detailsBiz.rating} <span className="pd-reviews">({detailsBiz.reviews} reviews)</span></span>
                )}
              </div>

              <p className="business-detail-location">
                📍 {detailsBiz.address || detailsBiz.distance || ""}
              </p>

              <div className="pd-price-row">
                <div>
                  <span className="pd-price">₹{Number(detailsBiz.price || 0).toLocaleString("en-IN")}</span>
                  {detailsBiz.unit && <span className="pd-unit">{detailsBiz.unit}</span>}
                </div>
                <div className="pd-qty-stepper">
                  <button onClick={() => setDetailsQty((q) => Math.max(1, q - 1))}>−</button>
                  <span>{detailsQty}</span>
                  <button onClick={() => setDetailsQty((q) => q + 1)}>+</button>
                </div>
              </div>

              <div className="pd-action-row">
                <button
                  className="pd-add-cart-btn"
                  onClick={() => addToCart({ productId: detailsBiz.id, type: "product", quantity: detailsQty })}
                >
                  🛒 Add to Cart
                </button>
                <button className="pd-buy-now-btn">Buy Now</button>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}