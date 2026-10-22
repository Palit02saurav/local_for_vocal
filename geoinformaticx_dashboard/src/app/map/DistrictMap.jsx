    "use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import "../products/new/new-product.css";

export default function DistrictMap() {
  const [names, setNames] = useState([]);
  const [saved, setSaved] = useState([]);
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const [n, s] = await Promise.all([
        api.get("/geo/district-names"),
        api.get("/geo/district-images"),
      ]);
      setNames(n.data.data?.names || []);
      setSaved(s.data.data?.images || []);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const states = useMemo(() => [...new Set(names.map((n) => n.state))].sort(), [names]);
  const districts = useMemo(
    () => names.filter((n) => n.state === state).map((n) => n.district),
    [names, state]
  );

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!state || !district || !image) {
      setErr("Choose a state, a district and an image.");
      return;
    }
    setBusy(true);
    try {
      const url = await uploadImage(image);
      await api.put("/geo/district-images", {
        state_name: state,
        district_name: district,
        image_url: url,
      });
      setMsg(`Saved for ${district}, ${state}.`);
      setImage(null);
      setPreview(null);
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row) => {
    setErr("");
    setMsg("");
    try {
      await api.delete("/geo/district-images", {
        params: { state: row.state_name, district: row.district_name },
      });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="np-page">
      <h1 className="np-title">Map</h1>
      <p className="np-subtitle">
        Pick a district and upload an image. It shows on the customer map at the centre of that district's border.
      </p>

      {err && <div className="np-submit-error">{err}</div>}
      {msg && <p style={{ color: "#2f8d46", fontWeight: 600 }}>{msg}</p>}

      <form onSubmit={save}>
        <div className="np-card">
          <div className="np-card-title">
            <span className="np-card-icon">📍</span>
            <h3>District Image</h3>
          </div>

          <div className="np-field">
            <label>State *</label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setDistrict("");
              }}
            >
              <option value="">Select state</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="np-field">
            <label>District *</label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!state}>
              <option value="">Select district</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="np-field">
            <label>Image *</label>
            <div className="np-dropzone">
              <span className="np-dropzone-icon">☁️</span>
              <label className="np-choose-files-btn">
                Choose File
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </label>
              <p className="np-dropzone-note">JPG, PNG or WEBP (Max. 5MB). Square images look best.</p>
            </div>
            {preview && (
              <div className="np-image-previews">
                <div className="np-image-preview" style={{ width: 90, height: 90 }}>
                  <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="np-actions">
          <button type="submit" className="np-save-btn" disabled={busy}>
            {busy ? "Saving..." : "💾 Save"}
          </button>
        </div>
      </form>

      <div className="np-card" style={{ marginTop: 20 }}>
        <div className="np-card-title">
          <span className="np-card-icon">🗺️</span>
          <h3>Saved District Images</h3>
        </div>
        {saved.length === 0 && <p style={{ color: "#777" }}>Nothing saved yet.</p>}
        {saved.map((row) => (
          <div
            key={`${row.state_name}|${row.district_name}`}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: "1px solid #eee" }}
          >
            <img
              src={row.image_url}
              alt={row.district_name}
              style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
            />
            <div style={{ flex: 1 }}>
              <strong>{row.district_name}</strong>
              <div style={{ fontSize: 12, color: "#777" }}>{row.state_name}</div>
            </div>
            <button type="button" className="np-cancel-btn" onClick={() => remove(row)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}