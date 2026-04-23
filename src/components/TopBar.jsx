// src/components/TopBar.jsx
import { useT } from "../i18n/translations";

export default function TopBar({
  language = "en",
  onLanguageChange,
  isLoggedIn,
  user
}) {
  const t = useT(language);

  const navigate = (page) => {
    window.dispatchEvent(new CustomEvent("footer-navigate", { detail: { page } }));
  };

  const LinkStyle = {
    color: "#4a5568",
    fontSize: "12.5px",
    textDecoration: "none",
    fontWeight: 600,
    cursor: "pointer",
    transition: "color 0.2s",
    whiteSpace: "nowrap"
  };

  const SeparatorStyle = {
    color: "#cbd5e0",
    margin: "0 8px",
    fontSize: "12px",
    userSelect: "none"
  };

  const sectionStyle = {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    flexShrink: 0
  };

  return (
    <div className="top-announcement-bar" style={{
      background: "#fff",
      padding: "8px 20px",
      borderBottom: "1px solid #f1f5f9",
      width: "100%",
      boxSizing: "border-box"
    }}>
      <div className="bar-container" style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        flexWrap: "nowrap"
      }}>
        {/* Left: Links */}
        <div className="left-links" style={sectionStyle}>
          <span style={LinkStyle} onClick={() => navigate("about")}>{t.topbar.aboutUs}</span>
          <span style={SeparatorStyle}>|</span>
          <span style={LinkStyle} onClick={() => navigate("login")}>{t.topbar.myAccount}</span>
          <span style={SeparatorStyle}>|</span>
          <span style={LinkStyle} onClick={() => navigate("wishlist")}>{t.topbar.wishlist}</span>
          <span style={SeparatorStyle}>|</span>
          <span style={LinkStyle} onClick={() => navigate("orders")}>{t.topbar.orderTracking}</span>
        </div>

        {/* Center: Secure Message */}
        <div className="center-message" style={{
          color: "#1d5ba0",
          fontSize: "13px",
          fontWeight: 600,
          textAlign: "center",
          flex: 1,
          padding: "0 20px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          {t.topbar.secureMessage}
        </div>

        {/* Right: Selectors & Phone */}
        <div className="right-section" style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexShrink: 0
        }}>
          <div className="phone" style={{ fontSize: "13px", color: "#4a5568", whiteSpace: "nowrap" }}>
            {t.topbar.needHelp} <a href={`tel:${language === "ke" ? "+254700855019" : "+919800000000"}`} style={{ color: "#1d5ba0", fontWeight: 700, textDecoration: "none" }}>{language === "ke" ? "+254 700 855 019" : "+91 98000 00000"}</a>
          </div>
          <span className="separator" style={SeparatorStyle}>|</span>
          <div className="selectors" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Language toggle — flag images */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {[
                { val: "en", src: "https://flagcdn.com/w20/in.png", label: "EN", prefix: "+91" },
                { val: "ke", src: "https://flagcdn.com/w20/ke.png", label: "KE", prefix: "+254" },
              ].filter((opt) => {
                if (!isLoggedIn || !user?.phone) return true;
                if (user.phone.startsWith("+254") && opt.val !== "ke") return false;
                if (user.phone.startsWith("+91") && opt.val !== "en") return false;
                return true;
              }).map(({ val, src, label }) => {
                const isActive = language === val;
                return (
                  <button
                    key={val}
                    onClick={() => onLanguageChange && onLanguageChange(val)}
                    title={label}
                    style={{
                      display: "flex", alignItems: "center", gap: "5px",
                      padding: "3px 8px", borderRadius: "20px", cursor: "pointer",
                      border: isActive ? "2px solid #1d5ba0" : "2px solid transparent",
                      background: isActive ? "#f0f5ff" : "transparent",
                      opacity: isActive ? 1 : 0.45,
                      transition: "all 0.15s",
                      fontSize: "11px", fontWeight: 700,
                      color: "#1d5ba0",
                    }}
                  >
                    <img
                      src={src}
                      alt={label}
                      style={{ width: "20px", height: "14px", objectFit: "cover", borderRadius: "2px", display: "block" }}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
            <span className="separator" style={SeparatorStyle}>|</span>
            <span style={{ fontSize: "13px", color: "#4a5568", fontWeight: 700 }}>
              {language === "ke" ? "KES" : "INR"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
