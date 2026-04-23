import { useState, useEffect, useRef } from "react";
import SearchBox from "./SearchBox";
import { useT } from "../i18n/translations";

const CATEGORIES = [
  { value: "rice", icon: "fa-seedling", label: "Rice" },
  { value: "oil", icon: "fa-tint", label: "Oil" },
  { value: "wheat-flour", icon: "fa-bread-slice", label: "Wheat Flour" },
  { value: "salt", icon: "fa-mortar-pestle", label: "Salt" },
  { value: "sugar", icon: "fa-cube", label: "Sugar" },
  { value: "chilli-powder", icon: "fa-pepper-hot", label: "Chilli Powder" },
  { value: "turmeric-powder", icon: "fa-leaf", label: "Turmeric Powder" },
  { value: "pulses", icon: "fa-circle", label: "Pulses" },
  { value: "masala", icon: "fa-mortar-pestle", label: "Masala" },
  { value: "fruits", icon: "fa-apple-alt", label: "Fruits" },
  { value: "vegetables", icon: "fa-carrot", label: "Vegetables" },
  { value: "dairyProducts", icon: "fa-cheese", label: "Dairy Products" },
  { value: "feminineHygiene", icon: "fa-female", label: "Feminine Hygiene" },
  { value: "homeNeeds", icon: "fa-broom", label: "Home Needs" },
  { value: "babyCare", icon: "fa-baby", label: "Baby Care" },
  { value: "instantFood", icon: "fa-bolt", label: "Instant Food" },
  { value: "milkPowders", icon: "fa-glass-whiskey", label: "Milk Powders" },
  { value: "chipsAndNamkeens", icon: "fa-cookie-bite", label: "Chips & Namkeens" },
  { value: "oralCare", icon: "fa-tooth", label: "Oral Care" },
  { value: "biscuitsAndCookies", icon: "fa-cookie", label: "Biscuits & Cookies" },
  { value: "coolDrinks", icon: "fa-glass-cheers", label: "Cool Drinks" },
  { value: "bodyCare", icon: "fa-spa", label: "Body Care" },
  { value: "meat", icon: "fa-drumstick-bite", label: "Meat" },
];

export default function Header({
  onAccountClick, isLoggedIn, user,
  onCategorySelect, onLogoClick,
  onBack, currentPage = "home",
  cartCount = 0, wishlistCount = 0,
  onCartClick, onWishlistClick,
  onOpenProduct,
  language = "en",
  notifications = [],
  markAllRead
}) {
  const t = useT(language);

  const CATEGORIES = [
    { value: "rice",               icon: "fa-seedling",      label: t.categories.rice },
    { value: "oil",                icon: "fa-tint",          label: t.categories.oil },
    { value: "wheat-flour",        icon: "fa-bread-slice",   label: t.categories.wheatflour },
    { value: "salt",               icon: "fa-mortar-pestle", label: t.categories.salt },
    { value: "sugar",              icon: "fa-cube",          label: t.categories.sugar },
    { value: "chilli-powder",      icon: "fa-pepper-hot",    label: t.categories.chillipowder },
    { value: "turmeric-powder",    icon: "fa-leaf",          label: t.categories.turmericpowder },
    { value: "pulses",             icon: "fa-circle",        label: t.categories.pulses },
    { value: "masala",             icon: "fa-mortar-pestle", label: t.categories.masala },
    { value: "fruits",             icon: "fa-apple-alt",     label: t.categories.freshFruits },
    { value: "vegetables",         icon: "fa-carrot",        label: t.categories.vegetables },
    { value: "dairyProducts",      icon: "fa-cheese",        label: t.categories.dairyProducts },
    { value: "feminineHygiene",    icon: "fa-female",        label: t.categories.feminineHygiene },
    { value: "homeNeeds",          icon: "fa-broom",         label: t.categories.homeNeeds },
    { value: "babyCare",           icon: "fa-baby",          label: t.categories.babyCare },
    { value: "instantFood",        icon: "fa-bolt",          label: t.categories.instantFood },
    { value: "milkPowders",        icon: "fa-glass-whiskey", label: t.categories.milkPowders },
    { value: "chipsAndNamkeens",   icon: "fa-cookie-bite",   label: t.categories.chipsNamkeens },
    { value: "oralCare",           icon: "fa-tooth",         label: t.categories.oralCare },
    { value: "biscuitsAndCookies", icon: "fa-cookie",        label: t.categories.biscuitsCookies },
    { value: "coolDrinks",         icon: "fa-glass-cheers",  label: t.categories.coolDrinks },
    { value: "bodyCare",           icon: "fa-spa",           label: t.categories.bodyCare },
    { value: "meat",               icon: "fa-drumstick-bite", label: t.categories.meat },
  ];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const browseRef = useRef(null);
  const notesRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (browseRef.current && !browseRef.current.contains(e.target)) setDropdownOpen(false);
      if (notesRef.current && !notesRef.current.contains(e.target)) setNotesOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleDrawer = () => {
    setDrawerOpen((prev) => !prev);
    document.body.style.overflow = drawerOpen ? "" : "hidden";
  };

  const handleCategoryClick = (e, value) => {
    e.preventDefault();
    setDropdownOpen(false);
    setDrawerOpen(false);
    document.body.style.overflow = "";
    if (onCategorySelect) onCategorySelect(value);
  };

  const Badge = ({ count, color = "#e53e3e" }) => {
    if (!count || count <= 0) return null;
    return (
      <span className="badge" style={{ background: color, color: "#fff" }}>
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const AccountButton = () => (
    <a href="#" className="nav-icon-btn"
      onClick={(e) => { e.preventDefault(); if (onAccountClick) onAccountClick(); }}
      title={isLoggedIn ? (user?.name || "My Account") : "Sign In"}
    >
      {isLoggedIn ? (
        <span className="icon-wrap" style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <i className="fas fa-user-circle" style={{ fontSize: "24px", color: "#1d5ba0", lineHeight: 1 }}></i>
          <span style={{ position: "absolute", bottom: 0, right: "-2px", width: 8, height: 8, background: "#22c55e", borderRadius: "50%", border: "1.5px solid #fff" }} />
        </span>
      ) : (
        <span className="icon-wrap"><i className="fas fa-user"></i></span>
      )}
      <span className="label" style={isLoggedIn ? { color: "#1d5ba0", fontWeight: 700 } : {}}>
        {isLoggedIn ? t.header.account : t.header.login}
      </span>
    </a>
  );

  const CategoryLinks = () => (
    <>
      {CATEGORIES.map((cat) => (
        <a key={cat.value} href="#" onClick={(e) => handleCategoryClick(e, cat.value)}>
          <i className={`fas ${cat.icon}`}></i> {cat.label}
        </a>
      ))}
    </>
  );

  return (
    <header id="navbar" className={scrolled ? "scrolled" : ""}>
      <div className="nav-inner">

        {/* LEFT: Logo */}
        <div className="nav-left" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); if (onLogoClick) onLogoClick(); }}>
            <div className="logo-icon">
              <img src="assets/logo watermark.png" alt="logo" />
            </div>
            <span className="logo-text">PRIME-BASKET</span>
          </a>
        </div>

        {/* CENTER: Browse + Search */}
        <div className="nav-center" style={{ gap: "30px", justifyContent: "center" }}>
          <div className="browse-wrapper" ref={browseRef}>
            <button
              className={`browse-btn${dropdownOpen ? " open" : ""}`}
              aria-expanded={dropdownOpen}
              onClick={(e) => { e.stopPropagation(); setDropdownOpen((prev) => !prev); }}
            >
              <span className="bar-icon"><span></span><span></span><span></span></span>
              {t.header.browseAll}
              <i className="fa fa-chevron-down chevron"></i>
            </button>
            <nav className={`dropdown-menu${dropdownOpen ? " open" : ""}`} role="menu">
              <CategoryLinks />
            </nav>
          </div>
          <div className="search-wrapper" style={{ flex: 1, maxWidth: "600px" }}>
            <SearchBox onCategorySelect={onCategorySelect} onOpenProduct={onOpenProduct} language={language} />
          </div>
        </div>

        {/* RIGHT: Nav Icons */}
        <div className="nav-right">
          <div className="nav-icons">
            {/* Notifications */}
            <div className="nav-action-item" ref={notesRef} style={{ position: "relative" }}>
              <a href="#" className="nav-icon-btn" onClick={(e) => { e.preventDefault(); setNotesOpen(!notesOpen); }}>
                <span className="icon-wrap"><i className="far fa-bell"></i><Badge count={unreadCount} color="#e53e3e" /></span>
                <span className="label">{t.header.notifications}</span>
              </a>
              
              {notesOpen && (
                <div className="notes-dropdown" style={{
                  position: "absolute",
                  top: "100%",
                  right: "0",
                  width: "320px",
                  background: "white",
                  borderRadius: "16px",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                  marginTop: "10px",
                  zIndex: 2000,
                  overflow: "hidden",
                  border: "1px solid #f1f5f9",
                  animation: "slideDown 0.3s ease-out"
                }}>
                  <div style={{ padding: "16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 800, color: "#253d4e" }}>Notifications</h4>
                    {notifications.length > 0 && <span style={{ fontSize: "0.75rem", color: "#1d5ba0", cursor: "pointer", fontWeight: 700 }} onClick={markAllRead}>Mark all read</span>}
                  </div>
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                        <i className="fas fa-bell-slash" style={{ fontSize: "2rem", marginBottom: "10px", display: "block" }}></i>
                        <p style={{ fontSize: "0.85rem", margin: 0 }}>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(note => (
                        <div key={note.id} style={{ 
                          padding: "16px", 
                          borderBottom: "1px solid #f1f5f9", 
                          background: note.read ? "white" : "#f0f7ff",
                          display: "flex",
                          gap: "12px",
                          transition: "background 0.2s"
                        }}>
                          <div style={{ 
                            width: "36px", 
                            height: "36px", 
                            borderRadius: "10px", 
                            background: note.type === "success" ? "#dcfce7" : note.type === "delivery" ? "#fef9c3" : "#e0f2fe",
                            color: note.type === "success" ? "#16a34a" : note.type === "delivery" ? "#ca8a04" : "#1d5ba0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}>
                            <i className={`fas ${note.type === "success" ? "fa-check-circle" : note.type === "delivery" ? "fa-truck" : "fa-info-circle"}`}></i>
                          </div>
                          <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#253d4e", marginBottom: "2px" }}>{note.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4 }}>{note.message}</div>
                            <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "6px", fontWeight: 600 }}>{note.time}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div style={{ padding: "12px", textAlign: "center", borderTop: "1px solid #f1f5f9" }}>
                      <button style={{ background: "none", border: "none", color: "#1d5ba0", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>View All Activity</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist — clickable */}
            <a href="#" className="nav-icon-btn"
              onClick={(e) => { e.preventDefault(); if (onWishlistClick) onWishlistClick(); }}
            >
              <span className="icon-wrap"><i className="fas fa-heart"></i><Badge count={wishlistCount} /></span>
              <span className="label">{t.header.wishlist}</span>
            </a>

            {/* Cart — clickable */}
            <a href="#" className="nav-icon-btn"
              onClick={(e) => { e.preventDefault(); if (onCartClick) onCartClick(); }}
            >
              <span className="icon-wrap"><i className="fas fa-shopping-cart"></i><Badge count={cartCount} /></span>
              <span className="label">{t.header.basket}</span>
            </a>

            <AccountButton />
          </div>
        </div>

        {/* Hamburger */}
        <button className={`hamburger${drawerOpen ? " open" : ""}`} aria-label="Toggle menu" aria-expanded={drawerOpen} onClick={toggleDrawer}>
          <span></span><span></span><span></span>
        </button>
      </div>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer${drawerOpen ? " open" : ""}`}>
        <div className="mobile-search">
          <SearchBox onCategorySelect={(cat) => { setDrawerOpen(false); document.body.style.overflow = ""; onCategorySelect && onCategorySelect(cat); }} onOpenProduct={(prod) => { setDrawerOpen(false); document.body.style.overflow = ""; onOpenProduct && onOpenProduct(prod); }} mobile language={language} />
        </div>
        <div className="mobile-nav-icons">
          <a href="#" className="nav-icon-btn">
            <span className="icon-wrap"><i className="far fa-bell"></i><span className="badge">0</span></span>
            <span className="label">{t.header.notifications}</span>
          </a>
          <a href="#" className="nav-icon-btn"
            onClick={(e) => { e.preventDefault(); setDrawerOpen(false); document.body.style.overflow = ""; if (onWishlistClick) onWishlistClick(); }}
          >
            <span className="icon-wrap"><i className="fas fa-heart"></i><Badge count={wishlistCount} /></span>
            <span className="label">{t.header.wishlist}</span>
          </a>
          <a href="#" className="nav-icon-btn"
            onClick={(e) => { e.preventDefault(); setDrawerOpen(false); document.body.style.overflow = ""; if (onCartClick) onCartClick(); }}
          >
            <span className="icon-wrap"><i className="fas fa-shopping-cart"></i><Badge count={cartCount} /></span>
            <span className="label">{t.header.cart}</span>
          </a>
          <AccountButton />
        </div>
        <div className="mobile-categories">
          <p>{t.header.browseCategories}</p>
          <CategoryLinks />
        </div>
      </div>
    </header>
  );
}