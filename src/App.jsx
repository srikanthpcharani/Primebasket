// src/App.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import HeroSlider from "./components/HeroSlider";
import PhoneAuthModal from "./components/PhoneAuthModal";
import HomePage from "./pages/HomePage";
import AccountPage from "./pages/AccountPage";
import CategoryPage from "./pages/CategoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import PaymentPage from "./pages/PaymentPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import UnderDevelopmentPage from "./pages/UnderDevelopmentPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import FAQPage from "./pages/FAQPage";
import GenericStaticPage from "./pages/GenericStaticPage";
import { translations } from "./i18n/translations";
import { cleanPrice } from "./utils/priceUtils";

export default function App() {
  const { isAuthenticated, user, login, logout } = useAuth();

  // ── Navigation state ──
  const [page, setPage] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ── Payment & Order state ──
  const [checkoutData, setCheckoutData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [orders, setOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_orders") || "[]"); } catch { return []; }
  });
  const [accountSection, setAccountSection] = useState("profile");

  // ── Cart & Wishlist ──
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_cart") || "[]"); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_wishlist") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("pb_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("pb_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // ── Cart Toast Panel ──
  const [cartToast, setCartToast] = useState(null); // { product, qty }
  const cartToastTimer = useRef(null);

  // ── Modal ──
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // ── Notifications ──
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pb_notifications") || "[]"); } catch { return []; }
  });

  const addNotification = (title, message, type = "info") => {
    const newNote = {
      id: Date.now(),
      title,
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => {
      const updated = [newNote, ...prev].slice(0, 20);
      localStorage.setItem("pb_notifications", JSON.stringify(updated));
      showToast(`${title}: ${message}`);
      return updated;
    });
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("pb_notifications", JSON.stringify(updated));
  };

  // ── Language ──
  const [language, setLanguage] = useState(() => localStorage.getItem("pb_lang") || "en");

  useEffect(() => {
    localStorage.setItem("pb_lang", language);
  }, [language]);

  // ── Under-development page ──
  const [underDevLabel, setUnderDevLabel] = useState("");

  // Scroll to top on every page change
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page, selectedProduct]);

  // Listen for product-open events fired from ProductDetailPage similar cards
  useEffect(() => {
    const handler = (e) => openProduct(e.detail);
    window.addEventListener("open-product", handler);
    return () => window.removeEventListener("open-product", handler);
  }, []);

  // ── History API Support ──
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state) {
        const { page: p, cat: c, prod: pr, accSec } = event.state;
        setPage(p || "home");
        setSelectedCategory(c || null);
        setSelectedProduct(pr || null);
        if (accSec) setAccountSection(accSec);
      } else {
        setPage("home");
        setSelectedCategory(null);
        setSelectedProduct(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    
    // Initial state push
    if (!window.history.state) {
      window.history.replaceState({ page: "home" }, "", "");
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync state changes to history
  const isInternalChange = useRef(false);
  useEffect(() => {
    const currentState = window.history.state;
    const newState = { 
      page, 
      cat: selectedCategory, 
      prod: selectedProduct, 
      accSec: page === "account" ? accountSection : null 
    };

    // Only push if different from current state to avoid loops
    if (JSON.stringify(currentState) !== JSON.stringify(newState)) {
      window.history.pushState(newState, "", "");
    }
  }, [page, selectedCategory, selectedProduct, accountSection]);

  // Listen for footer under-development link clicks
  useEffect(() => {
    const handler = (e) => {
      setUnderDevLabel(e.detail?.label || "");
      setPage("under-dev");
    };
    window.addEventListener("open-under-dev", handler);
    return () => window.removeEventListener("open-under-dev", handler);
  }, []);

  // Listen for static page navigation from footer
  useEffect(() => {
    const handler = (e) => {
      const targetPage = e.detail?.page;
      if (!targetPage) return;

      if (targetPage === "login") {
        if (!isAuthenticated) setIsLoginModalOpen(true);
        else setPage("account");
      } else if (targetPage === "cart") {
        goCart();
      } else if (targetPage === "wishlist") {
        goWishlist();
      } else if (targetPage === "orders") {
        setAccountSection("orders");
        if (isAuthenticated) setPage("account");
        else setIsLoginModalOpen(true);
      } else if (targetPage === "help") {
        setAccountSection("help");
        if (isAuthenticated) setPage("account");
        else setIsLoginModalOpen(true);
      } else if (targetPage.startsWith("cat:")) {
        const cat = targetPage.replace("cat:", "");
        goCategory(cat);
      } else {
        setPage(targetPage);
      }
    };
    window.addEventListener("footer-navigate", handler);
    return () => window.removeEventListener("footer-navigate", handler);
  }, [isAuthenticated]);

  // ── Navigation helpers ──
  const goHome = () => { setPage("home"); setSelectedCategory(null); setSelectedProduct(null); };
  const goCategory = (cat) => { setSelectedCategory(cat); setSelectedProduct(null); setPage("category"); };
  const openProduct = (product) => { setSelectedProduct(product); setPage("product"); };
  const goCart = () => setPage("cart");
  const goWishlist = () => setPage("wishlist");

  const goCheckout = (data) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    setCheckoutData(data);
    setPage("payment");
  };

  const handlePaymentSuccess = (order) => {
    const newOrder = {
      ...order,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      status: order.method === "cod" ? "Confirmed" : "Processing",
    };
    const updated = [newOrder, ...orders];
    setOrders(updated);
    localStorage.setItem("pb_orders", JSON.stringify(updated));
    setOrderData(newOrder);
    setCart([]);
    localStorage.removeItem("pb_cart");

    // Add real-time notification
    addNotification(
      "Order Placed!",
      `Your order #${newOrder.id || Date.now().toString().slice(-6)} has been placed successfully.`,
      "success"
    );

    // Mock "Delivered" notification after 30 seconds for demo
    setTimeout(() => {
      addNotification(
        "Order Delivered",
        `Great news! Your order from Prime Basket has been delivered. Enjoy!`,
        "delivery"
      );
    }, 30000);

    setPage("order-success");
  };

  // ── Cart Toast Panel ──
  const showCartToast = useCallback((product, updatedCart) => {
    if (cartToastTimer.current) clearTimeout(cartToastTimer.current);
    const item = updatedCart.find(i => i._uid === product._uid);
    setCartToast({ product, qty: item ? item.quantity : 1 });
    cartToastTimer.current = setTimeout(() => setCartToast(null), 3000);
  }, []);

  // ── Cart helpers ──
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._uid === product._uid);
      let updated;
      if (existing) {
        updated = prev.map((item) => item._uid === product._uid ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        updated = [...prev, { ...product, quantity: 1 }];
      }
      showCartToast(product, updated);
      return updated;
    });
  };

  const decreaseQuantity = (uid) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._uid === uid);
      if (existing && existing.quantity > 1) {
        return prev.map((item) => item._uid === uid ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter((item) => item._uid !== uid);
    });
  };

  const removeFromCart = (uid) => setCart((prev) => prev.filter((i) => i._uid !== uid));

  const updateCartQty = (uid, qty) => {
    if (qty <= 0) removeFromCart(uid);
    else setCart((prev) => prev.map((i) => i._uid === uid ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => { setCart([]); localStorage.removeItem("pb_cart"); };

  // ── Wishlist helpers ──
  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((item) => item._uid === product._uid);
      if (exists) {
        showToast(translations[language].toasts.removedFromWishlist);
        return prev.filter((item) => item._uid !== product._uid);
      }
      showToast(translations[language].toasts.addedToWishlist);
      return [...prev, product];
    });
  };

  // ── Legacy toast (wishlist/notification messages) ──
  const showToast = (message) => {
    const toast = document.getElementById("simple-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.style.transition = "all 0.3s ease";
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(-60px)";
    }, 2200);
  };

  // ── Auth ──
  const handleLoginSuccess = (data) => {
    const userData = data?.user ?? { id: data?.id, name: data?.name || "User", phone: data?.phone || "", email: data?.email || "", role: data?.role || "CUSTOMER" };
    
    // Auto-detect region from phone number if available
    const userPhone = userData.phone || "";
    let targetLang = language;
    if (userPhone.startsWith("+254")) {
      targetLang = "ke";
    } else if (userPhone.startsWith("+91")) {
      targetLang = "en";
    }

    const langChanged = targetLang !== language;
    if (langChanged) {
      setLanguage(targetLang);
      localStorage.setItem("pb_lang", targetLang);
    }

    // Clear guest cart/wishlist for fresh login experience as requested
    setCart([]);
    setWishlist([]);
    localStorage.removeItem("pb_cart");
    localStorage.removeItem("pb_wishlist");

    login(userData, { accessToken: data?.accessToken, refreshToken: data?.refreshToken });
    setIsLoginModalOpen(false);

    // Always redirect to the home page upon login. This ensures a clean
    // slate since the guest cart/wishlist are cleared on login anyway.
    goHome();

    if (langChanged) {
      // Force a reload to ensure the entire app cleanly mounts in the new region/language
      setTimeout(() => { window.location.reload(); }, 100);
    }
  };

  const handleLogout = () => {
    // Clear all user-specific state
    setCart([]);
    setWishlist([]);
    setOrders([]);
    setOrderData(null);
    setCheckoutData(null);
    setNotifications([]);
    // Clear localStorage
    localStorage.removeItem("pb_cart");
    localStorage.removeItem("pb_wishlist");
    localStorage.removeItem("pb_orders");
    localStorage.removeItem("pb_notifications");
    localStorage.removeItem("pb_saved_addresses");
    // Logout from auth (clears user/tokens)
    logout();
    goHome();
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  // ── Render current page ──
  const renderPage = () => {

    if (page === "under-dev") {
      return <UnderDevelopmentPage label={underDevLabel} onGoHome={goHome} language={language} />;
    }
    if (page === "about") {
      return <AboutPage language={language} onGoHome={goHome} />;
    }
    if (page === "contact") {
      return <ContactPage language={language} onGoHome={goHome} />;
    }
    if (page === "privacy") {
      return <PrivacyPolicyPage language={language} onGoHome={goHome} />;
    }
    if (page === "terms") {
      return <TermsPage language={language} onGoHome={goHome} />;
    }
    if (page === "faq") {
      return <FAQPage language={language} onGoHome={goHome} />;
    }
    if (page === "delivery") {
      return <GenericStaticPage pageKey="delivery" language={language} onGoHome={goHome} />;
    }
    if (page === "careers") {
      return <GenericStaticPage pageKey="careers" language={language} onGoHome={goHome} />;
    }
    if (page === "vendor") {
      return <GenericStaticPage pageKey="vendor" language={language} onGoHome={goHome} />;
    }
    if (page === "accessibility") {
      return <GenericStaticPage pageKey="accessibility" language={language} onGoHome={goHome} />;
    }
    if (page === "shipping") {
      return <GenericStaticPage pageKey="shipping" language={language} onGoHome={goHome} />;
    }
    if (page === "affiliate") {
      return <GenericStaticPage pageKey="affiliate" language={language} onGoHome={goHome} />;
    }
    if (page === "farm-biz") {
      return <GenericStaticPage pageKey="farm-biz" language={language} onGoHome={goHome} />;
    }
    if (page === "farm-jobs") {
      return <GenericStaticPage pageKey="farm-jobs" language={language} onGoHome={goHome} />;
    }
    if (page === "suppliers") {
      return <GenericStaticPage pageKey="suppliers" language={language} onGoHome={goHome} />;
    }
    if (page === "promotions") {
      return <GenericStaticPage pageKey="promotions" language={language} onGoHome={goHome} />;
    }
    if (page === "compare") {
      return <GenericStaticPage pageKey="compare" language={language} onGoHome={goHome} />;
    }

    if (page === "account" && isAuthenticated) {
      return <AccountPage user={user} onGoHome={goHome} orders={orders} initialSection={accountSection} onSectionChange={setAccountSection} language={language} onLogout={handleLogout} />;
    }
    if (page === "cart") {
      return (
        <CartPage
          cart={cart}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          onOpenProduct={openProduct}
          onContinueShopping={goHome}
          onGoAccount={() => { if (isAuthenticated) setPage("account"); else setIsLoginModalOpen(true); }}
          onCheckout={goCheckout}
          language={language}
        />
      );
    }
    if (page === "wishlist") {
      return (
        <WishlistPage
          wishlist={wishlist}
          cart={cart}
          toggleWishlist={toggleWishlist}
          onAddCart={addToCart}
          onDecreaseCart={decreaseQuantity}
          onOpenProduct={openProduct}
          onContinueShopping={goHome}
          language={language}
        />
      );
    }
    if (page === "payment" && checkoutData) {
      return (
        <PaymentPage
          cart={cart}
          total={checkoutData.total}
          delivery={checkoutData.delivery}
          address={checkoutData.address}
          onBack={goCart}
          onSuccess={handlePaymentSuccess}
          language={language}
        />
      );
    }
    if (page === "order-success" && orderData) {
      return (
        <OrderSuccessPage
          order={orderData}
          onGoHome={goHome}
          onGoOrders={() => {
            setAccountSection("orders");
            if (isAuthenticated) setPage("account");
            else setIsLoginModalOpen(true);
          }}
          language={language}
        />
      );
    }
    if (page === "category") {
      return (
        <CategoryPage
          category={selectedCategory}
          onCategoryChange={goCategory}
          onBack={goHome}
          onAddCart={addToCart}
          onDecreaseCart={decreaseQuantity}
          onOpenProduct={openProduct}
          cart={cart}
          wishlist={wishlist}
          toggleWishlist={toggleWishlist}
          language={language}
        />
      );
    }
    if (page === "product" && selectedProduct) {
      return (
        <ProductDetailPage
          product={selectedProduct}
          onBack={goHome}
          onAddCart={addToCart}
          onDecreaseCart={decreaseQuantity}
          cart={cart}
          wishlist={wishlist}
          toggleWishlist={toggleWishlist}
          onCategorySelect={goCategory}
          onOpenProduct={openProduct}
          language={language}
        />
      );
    }
    if (page === "home") {
      return (
        <>
          <HeroSlider language={language} />
          <HomePage
            onAddCart={addToCart}
            onDecreaseCart={decreaseQuantity}
            onCategorySelect={goCategory}
            onOpenProduct={openProduct}
            cart={cart}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            language={language}
          />
        </>
      );
    }
  };

  return (
    <>
      <Layout
        currentPage={page}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onAccountClick={() => { if (isAuthenticated) setPage("account"); else setIsLoginModalOpen(true); }}
        onCartClick={goCart}
        onWishlistClick={goWishlist}
        isLoggedIn={isAuthenticated}
        user={user}
        onCategorySelect={goCategory}
        onLogoClick={goHome}
        language={language}
        onLanguageChange={setLanguage}

        // Chatbot props
        cart={cart}
        wishlist={wishlist}
        onAddToCart={addToCart}
        toggleWishlist={toggleWishlist}
        onRemoveFromCart={removeFromCart}
        onUpdateCartQty={updateCartQty}
        onClearCart={clearCart}
        onOpenProduct={openProduct}
        notifications={notifications}
        markAllRead={markAllRead}
      >
        {renderPage()}
      </Layout>

      {/* ── Zepto-style Cart Preview Panel ── */}
      <div style={{
        position: "fixed", top: "16px", right: "16px",
        transform: cartToast ? "translateY(0)" : "translateY(calc(-100% - 30px))",
        transition: "transform 0.38s cubic-bezier(0.34, 1.3, 0.64, 1)",
        width: "min(320px, 88vw)",
        background: "#fff",
        borderRadius: "14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        zIndex: 99999,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "12px 16px 10px",
          borderBottom: "1px solid #f0f0f0",
        }}>
          <i className="fas fa-check-circle" style={{ color: "#2e7d32", fontSize: "18px" }}></i>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#2e7d32" }}>Added to Cart</span>
        </div>

        {/* Product Row */}
        {cartToast && (() => {
          const p = cartToast.product;
          const name = language === "te" ? (p.nameTe || p.name) : language === "sw" ? (p.nameSw || p.name) : p.name;
          const price = p.offerPrice ?? p.price ?? 0;
          const mrp = p.mrp ?? p.originalPrice ?? null;
          const unit = p.unit || p.weight || "";
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
              {/* Image */}
              <div style={{
                width: "64px", height: "64px", flexShrink: 0,
                borderRadius: "8px", border: "1px solid #eee",
                overflow: "hidden", background: "#fafafa",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {p.image || p.imageUrl ? (
                  <img src={p.image || p.imageUrl} alt={name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <i className="fas fa-box" style={{ color: "#ccc", fontSize: "22px" }}></i>
                )}
              </div>
              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, fontSize: "14px", color: "#1a1a1a",
                  overflow: "hidden", textOverflow: "ellipsis",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  lineHeight: 1.35,
                }}>{name}</div>
                {unit && <div style={{ fontSize: "12px", color: "#888", marginTop: "3px" }}>{unit} ×{cartToast.qty}</div>}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <span style={{
                    background: "#2e7d32", color: "#fff",
                    fontWeight: 700, fontSize: "14px",
                    padding: "3px 10px", borderRadius: "6px",
                   }}>{language === "ke" ? `KES ${cleanPrice(price)}` : `₹${cleanPrice(price)}`}</span>
                  {mrp && mrp > price && (
                    <span style={{ fontSize: "13px", color: "#aaa", textDecoration: "line-through" }}>{language === "ke" ? `KES ${cleanPrice(mrp)}` : `₹${cleanPrice(mrp)}`}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Go to Cart Button */}
        <div
          onClick={() => { setCartToast(null); goCart(); }}
          style={{
            borderTop: "1px solid #f0f0f0",
            padding: "12px 16px",
            textAlign: "center",
            fontWeight: 700, fontSize: "14px",
            color: "#e91e8c",
            cursor: "pointer",
            userSelect: "none",
            letterSpacing: "0.2px",
          }}
        >
          Go to Cart &nbsp;›
        </div>
      </div>

      {/* Simple toast for wishlist/notification messages */}
      <div id="simple-toast" style={{
        opacity: 0, transform: "translateX(-50%) translateY(-60px)",
        transition: "all 0.3s ease",
        position: "fixed", top: "76px", left: "50%",
        background: "#222", color: "#fff", padding: "9px 18px",
        borderRadius: "8px", fontWeight: 600, fontSize: "13px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.28)", zIndex: 99998,
        whiteSpace: "nowrap", width: "max-content", pointerEvents: "none",
      }} />

      <PhoneAuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        language={language}
      />
    </>
  );
}