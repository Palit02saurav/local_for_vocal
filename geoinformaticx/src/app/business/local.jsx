"use client";

import Explore from "@/components/explore/explore";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { allBusinesses } from "@/lib/businesses";
import { ALL_LEGEND_CATEGORIES } from "@/lib/categories";
import { addToCart } from "@/lib/cart";
import { FaHeart, FaRegHeart, FaExpand, FaMapMarkedAlt, FaThList } from "react-icons/fa";
import "./local.css";

const DEFAULT_CENTER = { lat: 22.5726, lng: 88.3639 }; // Kolkata
const PIN_PATH =
  "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1 1 10,-30 C 10,-22 2,-20 0,0 z";

// Fixed reference point for the 10-min delivery eligibility check.
// Later this can be swapped for the customer's live geolocation.
const CUSTOMER_LOCATION = { lat: 22.480509, lng: 88.3730658 };
const DELIVERY_RADIUS_KM = 3;

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
  const userMarkerRef = useRef(null);
  const circleRef = useRef(null);
  const infoWindowRef = useRef(null);

  const [listingType, setListingType] = useState("All"); // "All" | "Products" | "Services"
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [businessType, setBusinessType] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [distanceKm, setDistanceKm] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [viewMode, setViewMode] = useState("map"); // "map" | "list"
  const [favorites, setFavorites] = useState(new Set());
  const [mapReady, setMapReady] = useState(false);

  // Every filter change produces a fresh array here — this is what drives
  // both the nearby-card list and the map pins below.
  const filteredBusinesses = useMemo(() => {
    return allBusinesses.filter((b) => {
      if (listingType !== "All" && b.listingType !== listingType) return false;
      if (selectedCategory !== "All" && b.category !== selectedCategory) return false;
      if (businessType !== "All" && b.type && b.type !== businessType) return false;
      if (minRating && b.rating && b.rating < minRating) return false;
      const km = parseDistanceKm(b.distance);
      if (km !== null && km > distanceKm) return false;
      if (
        searchQuery &&
        !`${b.name} ${b.category} ${b.address || ""}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [listingType, selectedCategory, businessType, minRating, distanceKm, searchQuery]);

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
      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }

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
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        infoWindowRef.current = new window.google.maps.InfoWindow();
      } else {
        mapInstance.current.setCenter(center);
      }

      if (userMarkerRef.current) userMarkerRef.current.setMap(null);
      userMarkerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapInstance.current,
        title: "Your location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4a90d9",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });

      if (circleRef.current) circleRef.current.setMap(null);
      circleRef.current = new window.google.maps.Circle({
        map: mapInstance.current,
        center,
        radius: distanceKm * 1000,
        fillColor: "#4a90d9",
        fillOpacity: 0.08,
        strokeColor: "#4a90d9",
        strokeOpacity: 0.3,
        strokeWeight: 1,
      });

      setMapReady(true);
    });
  }, [viewMode, center, distanceKm]);

  // Re-sync the business pins every time the filtered list changes.
  // This is the effect that makes every filter visibly change the pins on
  // the map, without ever tearing down and rebuilding the whole map.
  useEffect(() => {
    if (viewMode !== "map" || !mapReady || !mapInstance.current || !window.google) return;

    markersRef.current.forEach((m) => m.setMap(null));

    markersRef.current = filteredBusinesses.map((biz) => {
      const marker = new window.google.maps.Marker({
        position: { lat: biz.lat, lng: biz.lng },
        map: mapInstance.current,
        title: biz.name,
        icon: {
          path: PIN_PATH,
          fillColor: "#ea4335",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
          scale: 1,
          anchor: new window.google.maps.Point(0, 0),
        },
      });

      let closeTimeout = null;

      marker.addListener("mouseover", () => {
        if (closeTimeout) {
          clearTimeout(closeTimeout);
          closeTimeout = null;
        }

        const infoWindow = infoWindowRef.current;
        const distanceFromYou = haversineDistanceKm(CUSTOMER_LOCATION, {
          lat: biz.lat,
          lng: biz.lng,
        });
        const isEligible = distanceFromYou <= DELIVERY_RADIUS_KM;

        infoWindow.setContent(`
          <div class="map-info-card">
            <img class="map-info-img" src="${biz.img}" alt="${biz.name}" />
            <div class="map-info-body">
              <div class="map-info-name">${biz.name}</div>
              <div class="map-info-category">${biz.category}</div>
              <div class="map-info-rating">⭐ ${biz.rating ?? "—"} (${biz.reviews ?? 0})</div>
              <div class="map-info-address">📍 ${biz.address || biz.distance || ""}</div>
              <div class="map-info-distance">${biz.distance ? biz.distance + " away" : ""}</div>
              <div class="map-info-delivery">
                <button class="map-info-delivery-btn" id="check-delivery-${biz.slug}">🛵 Check 10-Min Delivery</button>
                <div class="map-info-delivery-result" id="delivery-result-${biz.slug}"></div>
                <button class="map-info-add-cart-btn" id="add-cart-${biz.slug}" style="display:none;">🛒 Add to Cart (10-Min Delivery)</button>
              </div>
              <button class="map-info-btn" id="view-details-${biz.slug}">View Details</button>
            </div>
          </div>
        `);
        infoWindow.open(mapInstance.current, marker);

        window.google.maps.event.addListenerOnce(infoWindow, "domready", () => {
          const viewBtn = document.getElementById(`view-details-${biz.slug}`);
          if (viewBtn) {
            viewBtn.addEventListener("click", () => {
              window.location.href = `/business/${biz.slug}`;
            });
          }

          const deliveryBtn = document.getElementById(`check-delivery-${biz.slug}`);
          const resultEl = document.getElementById(`delivery-result-${biz.slug}`);
          const addCartBtn = document.getElementById(`add-cart-${biz.slug}`);

          if (deliveryBtn && resultEl) {
            deliveryBtn.addEventListener("click", () => {
              if (isEligible) {
                resultEl.innerHTML = `✅ 10-Min Delivery available (${distanceFromYou.toFixed(1)} km away)`;
                resultEl.className = "map-info-delivery-result eligible";
                if (addCartBtn) addCartBtn.style.display = "block";
              } else {
                resultEl.innerHTML = `❌ Not available — you're ${distanceFromYou.toFixed(1)} km away (limit: ${DELIVERY_RADIUS_KM} km)`;
                resultEl.className = "map-info-delivery-result not-eligible";
                if (addCartBtn) addCartBtn.style.display = "none";
              }
            });
          }

          if (addCartBtn) {
            addCartBtn.addEventListener("click", () => {
              addToCart(
                {
                  id: `${biz.slug}-10min`,
                  name: biz.name,
                  seller: biz.name,
                  verified: biz.verified,
                  price: 0,
                  image: biz.img,
                  type: "10min-delivery",
                },
                1
              );
              addCartBtn.textContent = "✓ Added to Cart";
              addCartBtn.disabled = true;
            });
          }

          const cardEl = document.querySelector(".map-info-card");
          const bubbleEl = cardEl?.closest(".gm-style-iw");
          if (bubbleEl) {
            bubbleEl.addEventListener("mouseenter", () => {
              if (closeTimeout) {
                clearTimeout(closeTimeout);
                closeTimeout = null;
              }
            });
            bubbleEl.addEventListener("mouseleave", () => {
              closeTimeout = setTimeout(() => {
                infoWindowRef.current?.close();
              }, 150);
            });
          }
        });
      });

      marker.addListener("mouseout", () => {
        closeTimeout = setTimeout(() => {
          infoWindowRef.current?.close();
        }, 250);
      });
      marker.addListener("click", () => {
        window.location.href = `/business/${biz.slug}`;
      });

      return marker;
    });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
    };
  }, [filteredBusinesses, viewMode, mapReady]);

  return (
    <div className="local-page">
      <aside className="local-sidebar">
        <Explore
          listingType={listingType}
          setListingType={setListingType}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
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
              <Link key={biz.slug} href={`/business/${biz.slug}`} className="list-row">
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
                <Link href={`/business/${biz.slug}`} className="nearby-card-link">
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
    </div>
  );
}