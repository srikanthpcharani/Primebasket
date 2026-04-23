// src/pages/AccountPage.jsx
import { useState, useEffect } from "react";
import "./Account.css";
import { useAuth } from "../context/AuthContext";
import { useT } from "../i18n/translations";
import AddressModal from "../components/AddressModal";

// Shared key used by both AccountPage and CartPage
export const ADDRESSES_KEY = "pb_saved_addresses";

function AccountPage({ onGoHome, onLogout, initialSection = "profile", onSectionChange, orders: propOrders = [], language = "en" }) {
  const t = useT(language);
  const { logout, user } = useAuth();
  const currSym = language === "ke" ? "KES " : "\u20b9";
  const phonePrefix = language === "ke" ? "+254" : "+91";
  const [section, setSection] = useState(initialSection);

  // Sync when parent changes initialSection (e.g. navigating from OrderSuccessPage)
  useEffect(() => { setSection(initialSection); }, [initialSection]);

  const changeSection = (s) => { setSection(s); onSectionChange && onSectionChange(s); };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();   // clears cart, wishlist, auth, and goes home
    } else {
      logout();
      onGoHome();
    }
  };

  return (
    <div className="account-container">

      {/* Sidebar */}
      <div className="account-sidebar">
        <h2>{t.account.title}</h2>
        <div className="account-menu">

          <div className={`account-item ${section === "profile" ? "active" : ""}`} onClick={() => changeSection("profile")}>
            <i className="fas fa-user"></i>
            <span>{t.header.account}</span>
          </div>

          <div className={`account-item ${section === "orders" ? "active" : ""}`} onClick={() => changeSection("orders")}>
            <i className="fas fa-box"></i>
            <span>{t.account.orders}</span>
          </div>

          <div className={`account-item ${section === "addresses" ? "active" : ""}`} onClick={() => changeSection("addresses")}>
            <i className="fas fa-map-marker-alt"></i>
            <span>{t.account.addresses}</span>
          </div>

          <div className={`account-item ${section === "recent" ? "active" : ""}`} onClick={() => changeSection("recent")}>
            <i className="fas fa-history"></i>
            <span>{t.home.recentlyAdded}</span>
          </div>

          <div className={`account-item ${section === "notifications" ? "active" : ""}`} onClick={() => changeSection("notifications")}>
            <i className="fas fa-bell"></i>
            <span>{t.header.notifications}</span>
          </div>

          <div className={`account-item ${section === "payments" ? "active" : ""}`} onClick={() => changeSection("payments")}>
            <i className="fas fa-credit-card"></i>
            <span>{t.footer.paymentMethods}</span>
          </div>

          <div className={`account-item ${section === "help" ? "active" : ""}`} onClick={() => changeSection("help")}>
            <i className="fas fa-question-circle"></i>
            <span>{t.links.helpTicket}</span>
          </div>

          <div className="account-item logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>{t.account.logout}</span>
          </div>

        </div>
      </div>

      {/* Content Area */}
      <div className="account-content">
        {section === "profile" && <Profile user={user} t={t} language={language} />}
        {section === "orders" && <OrdersSection orders={propOrders} t={t} currSym={currSym} />}
        {section === "addresses" && <AddressSection t={t} phonePrefix={phonePrefix} language={language} />}
        {section === "recent" && <RecentOrdersSection t={t} language={language} />}
        {section === "notifications" && <NotificationsSection t={t} />}
        {section === "payments" && <PaymentsSection t={t} />}
        {section === "help" && <HelpSection t={t} />}
      </div>

    </div>
  );
}

export default AccountPage;


/* â”€â”€â”€ Profile Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function Profile({ user, t, language = "en" }) {
  const phonePrefix = language === "ke" ? "+254" : "+91";
  // Reformat stored phone: if user is in Kenya mode but number has +91, swap to +254
  const formatDisplayPhone = (phone) => {
    if (!phone) return "";
    if (language === "ke" && phone.startsWith("+254")) {
      return "+254 " + phone.slice(4);
    }
    if (phone.startsWith("+91")) {
      return "+91 " + phone.slice(3);
    }
    return phone;
  };
  const [isEditing, setIsEditing] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setPhoto(URL.createObjectURL(file));
  };

  const handleSave = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("user") || "{}");
      const updated = { ...saved, name, email, phone };
      localStorage.setItem("user", JSON.stringify(updated));
      setIsEditing(false);
      alert(t.account.details + " saved!");
    } catch {
      setIsEditing(false);
      alert(t.account.details + " saved!");
    }
  };

  return (
    <div className="profile-container" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.8rem", color: "#253d4e", margin: 0 }}>{t.account.details}</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid #1d5ba0", background: "transparent", color: "#1d5ba0", fontWeight: 700, cursor: "pointer" }}
          >
            EDIT
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
        <div className="profile-photo-section" style={{ position: "relative" }}>
          <img
            src={photo || "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"}
            alt="Profile"
            style={{ width: "120px", height: "120px", borderRadius: "50%", border: "4px solid #f0f5ff", objectFit: "cover" }}
          />
          {isEditing && (
            <div style={{ marginTop: "10px" }}>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ fontSize: "12px", width: "150px" }} />
            </div>
          )}
        </div>

        <div className="profile-form" style={{ flex: 1, minWidth: "300px" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "#7e7e7e", marginBottom: "5px" }}>FULL NAME</label>
            {isEditing ? (
              <input type="text" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ececec" }} value={name} onChange={(e) => setName(e.target.value)} />
            ) : (
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#253d4e" }}>{name || "N/A"}</div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "#7e7e7e", marginBottom: "5px" }}>EMAIL ADDRESS</label>
            {isEditing ? (
              <input type="email" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ececec" }} value={email} onChange={(e) => setEmail(e.target.value)} />
            ) : (
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#253d4e" }}>{email || "N/A"}</div>
            )}
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "#7e7e7e", marginBottom: "5px" }}>PHONE NUMBER</label>
            {isEditing ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ padding: "12px", background: "#f1f5f9", border: "1px solid #ececec", borderRadius: "8px", fontWeight: 700, color: "#64748b", flexShrink: 0 }}>{phonePrefix} </div>
                <input type="text" style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ececec" }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={language === "ke" ? "7XXXXXXXX" : "9XXXXXXXXX"} />
              </div>
            ) : (
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#253d4e" }}>{formatDisplayPhone(phone) || "N/A"}</div>
            )}
          </div>

          {isEditing && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleSave}
                style={{ flex: 1, padding: "14px", borderRadius: "10px", background: "#1d5ba0", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}
              >
                SAVE DETAILS
              </button>
              <button
                onClick={() => setIsEditing(false)}
                style={{ flex: 1, padding: "14px", borderRadius: "10px", background: "#f1f5f9", color: "#475569", border: "none", fontWeight: 700, cursor: "pointer" }}
              >
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* â”€â”€â”€ Orders Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function OrdersSection({ orders = [], t, currSym = "\u20b9" }) {
  const [expanded, setExpanded] = useState(null);

  const demoOrders = [
    { orderId: "PB1023", date: "10 Mar 2026", items: [], method: "card", total: 560, status: "Delivered" },
    { orderId: "PB1024", date: "11 Mar 2026", items: [], method: "upi", total: 320, status: "Processing" },
  ];
  const allOrders = [...orders, ...demoOrders];

  const methodLabel = { upi: "UPI", card: "Card", netbanking: "Net Banking", wallet: "Wallet", cod: "COD" };

  const statusStyle = (status) => ({
    padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
    background: status === "Delivered" ? "#dcfce7" : status === "Processing" || status === "Confirmed" ? "#fef9c3" : "#fee2e2",
    color: status === "Delivered" ? "#16a34a" : status === "Processing" || status === "Confirmed" ? "#ca8a04" : "#dc2626",
  });

  if (allOrders.length === 0) {
    return (
      <div className="orders-card" style={{ textAlign: "center", padding: "60px 20px" }}>
        <i className="fas fa-box-open" style={{ fontSize: 48, color: "#d0d8e4", marginBottom: 14, display: "block" }}></i>
        <h3 style={{ fontFamily: "'Quicksand',sans-serif", color: "#253d4e" }}>{t.account.orders}</h3>
        <p style={{ color: "#7e7e7e", fontSize: 13 }}>{t.home.noProducts}</p>
      </div>
    );
  }

  return (
    <div className="orders-card">
      <h2>{t.account.orders}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {allOrders.map((order, i) => (
          <div key={order.orderId || i} style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            {/* Order header */}
            <div
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#f9fafb", cursor: "pointer", gap: 12 }}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: "#253d4e", fontFamily: "'Quicksand',sans-serif" }}>#{order.orderId}</span>
                <span style={{ fontSize: 12, color: "#7e7e7e" }}>{order.date} Â· {methodLabel[order.method] || order.method}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: "#1d5ba0", fontFamily: "'Quicksand',sans-serif" }}>{currSym}{Number(order.total).toFixed(2)}</span>
                <span style={statusStyle(order.status)}>{order.status}</span>
                <i className={`fas fa-chevron-${expanded === i ? "up" : "down"}`} style={{ fontSize: 11, color: "#7e7e7e" }}></i>
              </div>
            </div>

            {/* Expanded: item list */}
            {expanded === i && (
              <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)" }}>
                {order.items && order.items.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {order.items.map((item) => {
                      const price = parseFloat(String(item.price || "").replace(/[^0-9.]/g, "")) || 0;
                      const translatedName = t.products?.[item.name] || item.name;
                      return (
                        <div key={item._uid} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 8, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, flexShrink: 0 }}>
                            <img src={item.imageUrl} alt={translatedName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#253d4e" }}>{translatedName}</div>
                            <div style={{ fontSize: 12, color: "#7e7e7e" }}>Qty: {item.quantity} Â· {item.brand}</div>
                          </div>
                          <div style={{ fontWeight: 800, color: "#1d5ba0", fontFamily: "'Quicksand',sans-serif", fontSize: 14 }}>
                            {currSym}{(price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                    {order.address && (
                      <div style={{ marginTop: 8, padding: "10px 12px", background: "#f0f5ff", borderRadius: 8, fontSize: 12, color: "#253d4e", display: "flex", gap: 8 }}>
                        <i className="fas fa-map-marker-alt" style={{ color: "#1d5ba0", marginTop: 1 }}></i>
                        <span><strong>{order.address.type}:</strong> {order.address.text}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "#7e7e7e", margin: 0 }}>No item details available for this order.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


/* â”€â”€â”€ Addresses Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

// Load from localStorage
function loadAddresses() {
  try {
    const raw = localStorage.getItem(ADDRESSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAddresses(list) {
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify(list));
}

export function AddressSection({ t, phonePrefix = "+91", language = "en" }) {
  const [addresses, setAddresses] = useState(loadAddresses);
  const [editIndex, setEditIndex] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Persist whenever addresses change
  useEffect(() => { saveAddresses(addresses); }, [addresses]);

  const handleModalSave = (data) => {
    const fullText = `${data.house}, ${data.building ? data.building + ", " : ""}${data.area}${data.landmark ? " (Landmark: " + data.landmark + ")" : ""}${data.pincode ? " - " + data.pincode : ""}`;
    const newAddr = {
      type: data.type,
      text: fullText,
      details: data
    };

    if (editIndex !== null) {
      const updated = [...addresses];
      updated[editIndex] = newAddr;
      setAddresses(updated);
      setEditIndex(null);
    } else {
      if (addresses.length >= 5) { alert("Maximum 5 addresses allowed"); return; }
      setAddresses([...addresses, newAddr]);
    }
    setIsModalOpen(false);
    setShowOptions(false);
  };

  const deleteAddress = (i) => setAddresses(addresses.filter((_, idx) => idx !== i));

  const editAddress = (i) => {
    setEditIndex(i);
    setIsModalOpen(true);
  };

  return (
    <div className="address-card">

      <div className="add-address-bar" onClick={() => { setIsModalOpen(true); setEditIndex(null); }}>
        <span className="plus" style={{ color: "#1d5ba0", fontSize: "1.2rem", fontWeight: 700, marginRight: "8px" }}>+</span>
        <span style={{ color: "#1d5ba0", fontWeight: 700 }}>{t.cart.addNewAddress}</span>
      </div>

      <h3 style={{ fontSize: "1.2rem", color: "#253d4e", marginTop: "20px", marginBottom: "15px" }}>{t.account.addresses}</h3>

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        initialData={editIndex !== null ? addresses[editIndex].details : null}
        t={t}
        language={language}
      />

      {addresses.length === 0 && (
        <p style={{ color: "#7e7e7e", fontSize: 14, padding: "12px 0" }}>{t.cart.noAddresses}</p>
      )}

      {addresses.map((addr, i) => (
        <div key={i} className="address-item-card" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "24px",
          border: "1px solid #ececec",
          borderRadius: "12px",
          marginBottom: "16px",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(29, 91, 160, 0.12)"; e.currentTarget.style.borderColor = "#1d5ba0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; e.currentTarget.style.borderColor = "#ececec"; }}
        >
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              background: "#f0f5ff",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1d5ba0",
              fontSize: "1.2rem"
            }}>
              <i className={addr.type === "Home" ? "fas fa-home" : addr.type === "Work" ? "fas fa-briefcase" : "fas fa-map-marker-alt"}></i>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <strong style={{ fontSize: "1.1rem", color: "#253d4e" }}>{addr.type}</strong>
                <span style={{ fontSize: "0.7rem", padding: "2px 8px", background: "#f0f5ff", color: "#1d5ba0", borderRadius: "4px", fontWeight: 800 }}>PRIMARY</span>
              </div>
              <p style={{ fontSize: "0.9rem", color: "#7e7e7e", lineHeight: 1.5, margin: 0, maxWidth: "400px" }}>{addr.text}</p>

              {addr.details?.receiverName && (
                <div style={{ marginTop: "10px", fontSize: "0.85rem", color: "#253d4e", display: "flex", gap: "10px" }}>
                  <span><i className="fas fa-user" style={{ fontSize: "0.75rem", color: "#94a3b8" }}></i> {addr.details.receiverName}</span>
                  <span><i className="fas fa-phone" style={{ fontSize: "0.75rem", color: "#94a3b8" }}></i> {phonePrefix} {addr.details.receiverPhone}</span>
                </div>
              )}

              <div style={{ marginTop: "16px", display: "flex", gap: "20px" }}>
                <button onClick={() => editAddress(i)} style={{ background: "transparent", border: "none", color: "#1d5ba0", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", padding: 0 }}>EDIT</button>
                <button onClick={() => deleteAddress(i)} style={{ background: "transparent", border: "none", color: "#ef4444", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", padding: 0 }}>DELETE</button>
              </div>
            </div>
          </div>
        </div>
      ))}

    </div>
  );
}


/* â”€â”€â”€ Recently Ordered Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function RecentOrdersSection({ t, language = "en" }) {
  const currSym = language === "ke" ? "KES " : "\u20b9";
  const recentItems = language === "ke" ? [
    { name: "Milk", price: `KES 60` },
    { name: "Eggs", price: `KES 150` },
    { name: "Bread", price: `KES 50` },
    { name: "Rice", price: `KES 800` },
  ] : [
    { name: "Milk", price: "\u20b940" },
    { name: "Eggs", price: "\u20b9120" },
    { name: "Bread", price: "\u20b935" },
    { name: "Rice", price: "\u20b9650" },
  ];

  return (
    <div className="recent-card">
      <h2>{t.home.recentlyAdded}</h2>
      <div className="recent-list">
        {recentItems.map((item, i) => {
          const translatedName = t.products?.[item.name] || item.name;
          return (
            <div key={i} className="recent-item">
              <div>
                <strong>{translatedName}</strong>
                <p>{item.price}</p>
              </div>
              <button onClick={() => alert(translatedName + " added to basket")}>
                Order Again
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* â”€â”€â”€ Notifications Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function NotificationsSection({ t }) {
  const notifications = [
    "Order PB1023 Delivered",
    "Your order is out for delivery",
    "10% discount on Fruits today",
    "New grocery items added to store",
  ];

  return (
    <div className="notifications-card">
      <h2>{t.header.notifications}</h2>
      <div className="notifications-list">
        {notifications.map((note, i) => (
          <div key={i} className="notification-item">
            <span className="tick">âœ”</span>
            <span>{note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* â”€â”€â”        {payments.map((payment, i) => (
          <div key={i} className="payment-item">
            <div>
              <strong>{payment.type}</strong>
              <p>{payment.value}</p>
            </div>
            <button
              className="remove-btn"
              onClick={() => setPayments(payments.filter((_, idx) => idx !== i))}
            >
              {t.cart.remove}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


/* â”€â”€â”€ Help Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function HelpSection({ t }) {
  const [openCategory, setOpenCategory] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleCategory = (cat) => {
    setOpenCategory(openCategory === cat ? null : cat);
    setOpenQuestion(null);
  };

  const toggleQuestion = (i) => setOpenQuestion(openQuestion === i ? null : i);

  const faqData = {
    "Coupons & Offers": [
      { q: "Coupon not working / expired coupon", a: "Every coupon comes with a validity period. If the validity is over you cannot use the coupon. Check the 'View coupons & offers' section for new offers." },
      { q: "I forgot to apply my coupon code. What do I do now?", a: "An order once placed cannot be edited. You can use the coupon for your next order." },
    ],
    "General Inquiry": [
      { q: "How do I delete my account?", a: "You can contact our customer support through 'Chat With Us' or email to delete your account." },
      { q: "Do you charge any taxes over product price?", a: "All product prices are inclusive of taxes. A delivery fee or small-cart fee may apply depending on the order." },
      { q: "What are your timings?", a: "Our support team is available from 6am to 3am." },
    ],
    "Payment Related": [
      { q: "What are the modes of payment?", a: "COD, credit/debit cards (Visa, Mastercard, Rupay), wallets, Pay Later, and online payments are supported." },
      { q: "How do I change the payment mode?", a: "Once an order is out for delivery, the payment method cannot be changed." },
      { q: "Is it safe to use my card?", a: "Yes. All transactions are processed via secure PCI DSS compliant payment gateways." },
      { q: "Why is my COD blocked?", a: "If orders are frequently cancelled after packing or delivery, COD may be temporarily disabled." },
      { q: "Do you charge for the bag?", a: "Prime-Basket does not charge for bags. However, a packaging fee may apply." },
    ],
    "Order / Products Related": [
      { q: "Can I change the delivery address?", a: "Once an order is placed, the delivery address cannot be changed." },
      { q: "Is there a minimum order value?", a: "There is no minimum or maximum order value." },
    ],
    "Wallet Related": [
      { q: "I am not able to add money to my wallet", a: "Please update the app to the latest version and try again." },
      { q: "Money added to wallet is not visible", a: "Update the app to the latest version and check again." },
    ],
  };

  return (
    <div className="help-card">
      <h2>{t.links.helpTicket}</h2>

      <div className="help-options">
        <button onClick={() => { window.location.href = "mailto:support@primebasket.com?subject=Prime Basket Support Request"; }}>
          Contact Support
        </button>
        <button onClick={() => alert("Complaint form will open here.")}>
          Raise Complaint
        </button>
        <button onClick={() => alert("Please provide the Order ID and describe the issue.")}>
          Report Order Issue
        </button>
      </div>

      <h3>FAQs</h3>

      {Object.keys(faqData).map((category) => (
        <div key={category} className="faq-category">
          <div className="faq-title" onClick={() => toggleCategory(category)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{category}</span>
            <i className={`fas fa-chevron-${openCategory === category ? "up" : "down"}`} style={{ fontSize: "12px", opacity: 0.5 }}></i>
          </div>
          {openCategory === category && (
            <div className="faq-questions" style={{ padding: "10px 0" }}>
              {faqData[category].map((item, i) => (
                <div key={i} className="faq-item" style={{ borderBottom: "1px solid #f0f0f0", marginBottom: "5px" }}>
                  <div 
                    className="faq-question" 
                    onClick={() => toggleQuestion(`${category}_${i}`)}
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      cursor: "pointer",
                      padding: "12px 15px",
                      fontWeight: 600,
                      color: "#253d4e",
                      fontSize: "14px"
                    }}
                  >
                    <span>{item.q}</span>
                    <i className={`fas fa-plus`} style={{ fontSize: "10px", transform: openQuestion === `${category}_${i}` ? "rotate(45deg)" : "none", transition: "0.2s" }}></i>
                  </div>
                  {openQuestion === `${category}_${i}` && (
                    <div className="faq-answer" style={{ padding: "0 15px 15px", color: "#7e7e7e", fontSize: "13px", lineHeight: 1.6 }}>
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
