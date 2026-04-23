import { useState, useEffect, useRef } from "react";

export default function AddressModal({ isOpen, onClose, onSave, initialData, t, language = "en" }) {
  const phonePrefix = language === "ke" ? "+254" : "+91";
  const isKenya = language === "ke";

  const [formData, setFormData] = useState({
    house: "", building: "", area: "", landmark: "",
    pincode: "", receiverName: "", receiverPhone: "", type: "Home"
  });
  const [locStatus, setLocStatus] = useState(""); // "", "detecting", "found", "denied"
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pickerCoords, setPickerCoords] = useState(null);
  
  // Map Search State
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState([]);

  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setLocStatus("");
    } else {
      setFormData({ house: "", building: "", area: "", landmark: "", pincode: "", receiverName: "", receiverPhone: "", type: "Home" });
      setLocStatus("");
    }
  }, [initialData, isOpen]);

  // Geolocation Logic
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus("denied");
      return;
    }
    setLocStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await reverseGeocode(latitude, longitude);
      },
      () => setLocStatus("denied"),
      { timeout: 8000 }
    );
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const addr = data.address || {};
      setFormData(prev => ({
        ...prev,
        area: addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || addr.county || "",
        pincode: addr.postcode || "",
        landmark: addr.road || addr.pedestrian || "",
        building: addr.building || addr.amenity || "",
      }));
      setLocStatus("found");
      return data;
    } catch {
      setLocStatus("denied");
    }
  };

  // Leaflet Map Picker Logic
  useEffect(() => {
    if (showMapPicker && mapRef.current && window.L) {
      const initialLat = isKenya ? -1.2921 : 17.3850;
      const initialLon = isKenya ? 36.8219 : 78.4867;

      if (!leafletMap.current) {
        leafletMap.current = window.L.map(mapRef.current).setView([initialLat, initialLon], 13);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMap.current);

        leafletMap.current.on('click', (e) => {
          const { lat, lng } = e.latlng;
          setPickerCoords({ lat, lng });
          if (markerRef.current) {
            markerRef.current.setLatLng(e.latlng);
          } else {
            markerRef.current = window.L.marker(e.latlng).addTo(leafletMap.current);
          }
        });
      }

      // Remove auto-geolocation on map load so it stays in the correct country by default
    }

    return () => {
      if (!showMapPicker && leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markerRef.current = null;
      }
    };
  }, [showMapPicker]);

  const confirmMapLocation = async () => {
    if (pickerCoords) {
      await reverseGeocode(pickerCoords.lat, pickerCoords.lng);
    }
    setShowMapPicker(false);
  };

  const handleMapSearch = async (e) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;
    try {
      const countryCode = isKenya ? "ke" : "in";
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&countrycodes=${countryCode}`);
      const data = await res.json();
      setMapSearchResults(data.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (leafletMap.current) {
      leafletMap.current.setView([lat, lng], 15);
      setPickerCoords({ lat, lng });
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      else markerRef.current = window.L.marker([lat, lng]).addTo(leafletMap.current);
    }
    setMapSearchResults([]);
    setMapSearchQuery("");
  };

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.house.trim() || !formData.area.trim()) {
      alert("Please enter House No and Area");
      return;
    }
    if (!formData.receiverName.trim() || !formData.receiverPhone.trim()) {
      alert("Please enter Receiver Name and Phone Number");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 2000, backdropFilter: "blur(4px)"
    }} onClick={onClose}>
      <div className="modal-content" style={{
        background: "white", width: "100%", maxWidth: "500px", borderRadius: "20px",
        overflow: "hidden", position: "relative", animation: "slideUp 0.3s ease-out"
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#253d4e" }}>Enter Address Details</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#94a3b8" }}>&times;</button>
        </div>

        <div style={{ maxHeight: "80vh", overflowY: "auto", padding: "20px" }}>

          {/* Quick Location Options */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
            <button
              onClick={() => setShowMapPicker(true)}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#1d5ba0", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
            >
              <i className="fa-solid fa-map-location-dot"></i> Select on Map
            </button>
            <button
              onClick={handleGetCurrentLocation}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#1d5ba0", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
            >
              <i className="fa-solid fa-crosshairs"></i> Get Current Location
            </button>
          </div>

          {/* Location detection status */}
          {locStatus === "detecting" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#eff6ff", borderRadius: "10px", marginBottom: "12px", fontSize: "13px", color: "#1d4ed8", fontWeight: 600 }}>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
              Detecting your location…
            </div>
          )}
          {locStatus === "found" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#f0fdf4", borderRadius: "10px", marginBottom: "12px", fontSize: "13px", color: "#15803d", fontWeight: 600 }}>
              ✅ Location detected! Please verify and complete the remaining fields.
            </div>
          )}
          {locStatus === "denied" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#fff7ed", borderRadius: "10px", marginBottom: "12px", fontSize: "13px", color: "#9a3412", fontWeight: 600 }}>
              📍 Location access denied. Please fill address manually.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", marginBottom: "6px", display: "block" }}>HOUSE / FLAT / FLOOR NO.</label>
              <input type="text" placeholder="e.g. Flat 402, 4th Floor" value={formData.house} onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", outline: "none" }} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", marginBottom: "6px", display: "block" }}>APARTMENT / BUILDING NAME</label>
              <input type="text" placeholder="e.g. Sunshine Apartments" value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", outline: "none" }} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", marginBottom: "6px", display: "block" }}>AREA / STREET / SECTOR</label>
              <input type="text" placeholder="e.g. KPHB Phase 1" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", outline: "none" }} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", marginBottom: "6px", display: "block" }}>LANDMARK (OPTIONAL)</label>
              <input type="text" placeholder="e.g. Near HDFC Bank" value={formData.landmark} onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", outline: "none" }} />
            </div>

            <div style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: "15px", borderRadius: "12px", marginTop: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", marginBottom: "6px", display: "block" }}>RECEIVER'S NAME</label>
                <input type="text" placeholder="e.g. Nikhil" value={formData.receiverName} onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "white", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", marginBottom: "6px", display: "block" }}>RECEIVER'S PHONE NUMBER</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ padding: "12px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: "10px", color: "#64748b", fontWeight: 700 }}>{phonePrefix} </div>
                  <input type="text" placeholder="8519913550" value={formData.receiverPhone} onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                    style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", background: "white", outline: "none" }} />
                </div>
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
              <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", marginBottom: "10px", display: "block" }}>SAVE ADDRESS AS</label>
              <div style={{ display: "flex", gap: "10px" }}>
                {[{ id: "Home", icon: "fa-home" }, { id: "Work", icon: "fa-briefcase" }, { id: "Other", icon: "fa-location-dot" }].map(item => (
                  <button key={item.id} onClick={() => setFormData({ ...formData, type: item.id })}
                    style={{
                      flex: 1, padding: "12px", borderRadius: "12px", border: formData.type === item.id ? "2px solid #1d5ba0" : "1.5px solid #e2e8f0",
                      background: formData.type === item.id ? "#f0f5ff" : "white", color: formData.type === item.id ? "#1d5ba0" : "#64748b",
                      fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s"
                    }}><i className={`fas ${item.icon}`}></i>{item.id}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px", borderTop: "1px solid #f1f5f9" }}>
          <button onClick={handleSave} style={{
            width: "100%", padding: "16px", borderRadius: "12px", background: "#1d5ba0", color: "white",
            border: "none", fontWeight: 800, fontSize: "1rem", cursor: "pointer", boxShadow: "0 8px 20px rgba(29, 91, 160, 0.2)"
          }}>SAVE ADDRESS & CONTINUE</button>
        </div>

        {/* ── INTERACTIVE MAP PICKER OVERLAY ── */}
        {showMapPicker && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "#111827", zIndex: 100, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "15px 20px", background: "#111827", borderBottom: "1px solid #374151", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Select Location</h4>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9ca3af" }}>Click map to pin or search below.</p>
              </div>
              <button onClick={() => setShowMapPicker(false)} style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>&times;</button>
            </div>

            <div style={{ padding: "10px 20px", background: "#1f2937", position: "relative", zIndex: 1000 }}>
              <form onSubmit={handleMapSearch} style={{ display: "flex", gap: "10px" }}>
                <input 
                  type="text" 
                  placeholder={isKenya ? "Search in Kenya (e.g. Nairobi)" : "Search in India (e.g. Hyderabad)"}
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: "8px", border: "1px solid #4b5563", background: "#374151", color: "white", outline: "none" }}
                />
                <button type="submit" style={{ padding: "10px 15px", borderRadius: "8px", background: "#3b82f6", color: "white", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  Search
                </button>
              </form>
              
              {mapSearchResults.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: "20px", right: "20px", background: "white", borderRadius: "8px", overflow: "hidden", marginTop: "5px", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
                  {mapSearchResults.map((res, i) => (
                    <div 
                      key={i} 
                      onClick={() => selectSearchResult(res)}
                      style={{ padding: "10px 15px", borderBottom: "1px solid #e5e7eb", cursor: "pointer", color: "#1f2937", fontSize: "13px" }}
                    >
                      {res.display_name}
                    </div>
                  ))}
                  <div style={{ padding: "8px 15px", background: "#f3f4f6", textAlign: "right", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontWeight: 600 }} onClick={() => setMapSearchResults([])}>
                    Close
                  </div>
                </div>
              )}
            </div>

            <div ref={mapRef} style={{ flex: 1, width: "100%" }}></div>

            <div style={{ padding: "20px", background: "#111827", borderTop: "1px solid #374151", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "#9ca3af", fontSize: "13px" }}>
                Selected: <span style={{ color: "#60a5fa", fontWeight: 600 }}>{pickerCoords ? `${pickerCoords.lat.toFixed(6)}, ${pickerCoords.lng.toFixed(6)}` : "None"}</span>
              </div>
              <button
                onClick={confirmMapLocation}
                disabled={!pickerCoords}
                style={{
                  padding: "10px 24px", borderRadius: "8px", background: "#1d5ba0", color: "white",
                  border: "none", fontWeight: 700, cursor: pickerCoords ? "pointer" : "not-allowed",
                  opacity: pickerCoords ? 1 : 0.5, display: "flex", alignItems: "center", gap: "8px"
                }}
              >
                <i className="fa-solid fa-check"></i> Confirm Location
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .leaflet-container { font-family: inherit; }
      `}</style>
    </div>
  );
}

