// src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import { useT } from "../i18n/translations";
import { KENYA_ALL_PRODUCTS, KENYA_DEALS, KENYA_SECTIONS } from "../data/kenya_products";
import { cleanPrice } from "../utils/priceUtils";

const ALL_CATS = [
  "rice", "oil", "wheat-flour", "salt", "sugar", "chilli-powder",
  "turmeric-powder", "pulses", "masala", "fruits", "vegetables",
  "dairyProducts", "feminineHygiene", "homeNeeds", "babyCare",
  "instantFood", "milkPowders", "chipsAndNamkeens", "oralCare",
  "biscuitsAndCookies", "coolDrinks", "bodyCare",
];

const DEAL_CATS = ["fruits", "vegetables", "dairyProducts", "biscuitsAndCookies", "instantFood", "coolDrinks"];

const MULTICOL_CATS = {
  topSelling:    "rice",
  trending:      "oil",
  recentlyAdded: "masala",
  topRated:      "pulses",
};

const fetchCategory = (cat) =>
  get(ref(database, "categories/" + cat)).then((snap) => {
    const val = snap.val();
    return val ? Object.values(val).map((p, i) => ({ ...p, _cat: cat, _index: i, _uid: `${cat}_${i}` })) : [];
  });

const fetchWithCache = async (cat) => {
  const cacheKey = `pb_cat_${cat}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      sessionStorage.removeItem(cacheKey);
    }
  }
  const data = await fetchCategory(cat);
  if (data && data.length > 0) {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {
      console.warn("Storage quota exceeded, skipping cache");
    }
  }
  return data;
};

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const BADGE_CLASSES = ["bs", "bh", "bo", "bn"];

export default function HomePage({ onAddCart, onDecreaseCart, onCategorySelect, onOpenProduct, cart = [], wishlist = [], toggleWishlist, language = "en" }) {
  const t = useT(language);
  
  const [popular15, setPopular15] = useState([]);
  const [deals, setDeals]         = useState([]);
  const [multiCols, setMultiCols] = useState({ topSelling: [], trending: [], recentlyAdded: [], topRated: [] });
  const [loading, setLoading]     = useState(true);

  const getTranslatedName = (name) => {
    if (!name) return "";
    if (t.products?.[name]) return t.products[name];
    const entries = Object.entries(t.products || {}).sort((a, b) => b[0].length - a[0].length);
    for (const [key, val] of entries) {
      if (name.toLowerCase().includes(key.toLowerCase())) return val;
    }
    return name;
  };

  useEffect(() => {
    let cancelled = false;

    // ── Kenya / Swahili mode: use static local data, skip Firebase ────────
    if (language === "ke") {
      if (!cancelled) {
        setPopular15(shuffle(KENYA_ALL_PRODUCTS).slice(0, 15));
        setDeals(KENYA_DEALS);
        setMultiCols(KENYA_SECTIONS);
        setLoading(false);
      }
      return () => { cancelled = true; };
    }

    const load = async () => {
      setLoading(true);
      try {
        const popularResults = await Promise.all(ALL_CATS.map(fetchWithCache));
        let allPopular = popularResults.flat();

        const dealResults = await Promise.all(DEAL_CATS.map(fetchWithCache));
        let allDeals = dealResults.flat().filter((p) => p.oldPrice);

        const mcValues = await Promise.all(Object.values(MULTICOL_CATS).map(fetchWithCache));
        let [ts, tr, ra, tp] = mcValues;

        if (!cancelled) {
          setPopular15(shuffle(allPopular).slice(0, 15));
          setDeals(shuffle(allDeals).slice(0, 4));
          setMultiCols({
            topSelling:    ts.slice(0, 3),
            trending:      tr.slice(0, 3),
            recentlyAdded: ra.slice(0, 3),
            topRated:      tp.slice(0, 3),
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("HomePage fetch error:", err);
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [language]); // Reload when language changes

  const SkeletonCard = () => (
    <div style={{ background: "#fff", borderRadius: "10px", height: "240px", animation: "pulse 1.4s infinite ease-in-out" }} />
  );

  const ProductCard = ({ p, idx }) => {
    const inCart  = cart.find((c) => c._uid === p._uid);
    const qty     = inCart ? inCart.quantity : 0;
    const isWished = wishlist.some((w) => w._uid === p._uid);
    const translatedName = getTranslatedName(p.name);

    return (
      <div className="pcard" data-cat={p._cat} style={{ cursor: "pointer" }} onClick={() => onOpenProduct && onOpenProduct(p)}>
        <span className={`pbadge ${BADGE_CLASSES[idx % BADGE_CLASSES.length]}`}>
          {t.badges?.[p.badge?.toLowerCase()] || p.badge || (p.oldPrice ? t.badges?.sale : t.badges?.new) || "Sale"}
        </span>
        <button
          className="pwish"
          style={isWished ? { opacity: 1, background: "#ff3b81", color: "#fff" } : {}}
          onClick={(e) => { e.stopPropagation(); toggleWishlist && toggleWishlist(p); }}
        >
          <i className={isWished ? "fas fa-heart" : "far fa-heart"}></i>
        </button>
        <div className="pimg">
          <img src={p.imageUrl} alt={translatedName} loading="lazy" decoding="async" />
        </div>
        <div className="pbrand">{p.brand}</div>
        <div className="pname">{translatedName}</div>
        {p.stars != null && (
          <div className="pstars">⭐ {p.stars} {p.reviews && <span>({p.reviews})</span>}</div>
        )}
        <div className="pprice">
          <span className="pnew">
            {language === "ke" ? `KES ${cleanPrice(p.price)}` : `₹${cleanPrice(p.price)}`}
          </span>
          {p.oldPrice && (
            <span className="pold">
              {language === "ke" ? `KES ${cleanPrice(p.oldPrice)}` : `₹${cleanPrice(p.oldPrice)}`}
            </span>
          )}
        </div>
        <div className="p-action-row" onClick={(e) => e.stopPropagation()}>
          {qty > 0 ? (
            <div className="qty-control" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--green)",
              borderRadius: "8px",
              padding: "4px 8px",
              marginTop: "8px",
              height: "38px",
              color: "white",
              fontWeight: 700
            }}>
              <button 
                onClick={() => onDecreaseCart && onDecreaseCart(p._uid)}
                style={{ background: "transparent", border: "none", color: "white", fontSize: "18px", cursor: "pointer", width: "30px" }}
              >
                -
              </button>
              <span style={{ fontSize: "14px" }}>{qty}</span>
              <button 
                onClick={() => onAddCart && onAddCart(p)}
                style={{ background: "transparent", border: "none", color: "white", fontSize: "18px", cursor: "pointer", width: "30px" }}
              >
                +
              </button>
            </div>
          ) : (
            <button
              className="padd"
              onClick={() => onAddCart && onAddCart(p)}
              style={{ marginTop: "8px" }}
            >
              <i className="fas fa-shopping-cart"></i> {t.home.add}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>

      {/* ── POPULAR PRODUCTS ── */}
      <section className="products-section">
        <div className="container">
          <div className="sec-header">
            <div>
              <div className="sec-title">{t.home.popular}</div>
            </div>
          </div>

          <div className="products-layout">
            <div>
              <div className="products-grid" id="pGrid">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                  : popular15.length === 0
                    ? <p style={{ color: "#7e7e7e", padding: "20px 0" }}>{t.home.noProducts}</p>
                    : popular15.map((p, i) => <ProductCard key={p._uid} p={p} idx={i} />)
                }
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="sidebar">
              <div className="cat-box">
                <h3>{t.home.category}</h3>
                {[
                  { key: "fruits",           icon: "fa-apple-alt",    label: t.categories.freshFruits },
                  { key: "vegetables",       icon: "fa-carrot",       label: t.categories.vegetables },
                  { key: "dairyProducts",    icon: "fa-cheese",       label: t.categories.dairyProducts },
                  { key: "chipsAndNamkeens", icon: "fa-cookie-bite",  label: t.categories.chipsNamkeens },
                  { key: "coolDrinks",       icon: "fa-glass-cheers", label: t.categories.coolDrinks },
                  { key: "instantFood",      icon: "fa-bolt",         label: t.categories.instantFood },
                  { key: "babyCare",         icon: "fa-baby",         label: t.categories.babyCare },
                  { key: "bodyCare",         icon: "fa-spa",          label: t.categories.bodyCare },
                  { key: "feminineHygiene",  icon: "fa-female",       label: t.categories.feminineHygiene },
                ].map((c) => (
                  <div key={c.key} className="cat-item" style={{ cursor: "pointer" }} onClick={() => onCategorySelect && onCategorySelect(c.key)}>
                    <div className="cat-item-l">
                      <div className="cicon"><i className={`fas ${c.icon}`}></i></div>
                      {c.label}
                    </div>
                    <i className="fas fa-chevron-right" style={{ fontSize: "10px", color: "#bbb" }}></i>
                  </div>
                ))}
              </div>
              <div className="tags-box">
                <h3>{t.home.productTags}</h3>
                {["Organic", "Fresh", "Dairy", "Snacks", "Beverages", "Fruits", "Vegetables", "Spices"].map((tag) => (
                  <span key={tag} className="tag-pill">{t.categories?.[tag.toLowerCase()] || tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEALS OF THE DAY ── */}
      <section className="deals-section">
        <div className="deals-header">
          <h2 className="deals-title">{t.home.deals}</h2>
          <a href="#" className="deals-all-link" onClick={(e) => { e.preventDefault(); onCategorySelect && onCategorySelect("all"); }}>
            {t.home.allDeals} <i className="fa-solid fa-chevron-right" style={{ fontSize: "10px" }}></i>
          </a>
        </div>
        <div className="deals-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: "12px", height: "320px", animation: "pulse 1.4s infinite" }} />
              ))
            : deals.map((d, i) => {
                const inCart  = cart.find((c) => c._uid === d._uid);
                const qty     = inCart ? inCart.quantity : 0;
                const isWished = wishlist.some((w) => w._uid === d._uid);
                const translatedName = getTranslatedName(d.name);
                return (
                  <div key={d._uid} className="prod-card" style={{ cursor: "pointer", position: "relative" }} onClick={() => onOpenProduct && onOpenProduct(d)}>
                    <div className="card-img-zone">
                      <span className="disc-badge">{t.badges?.[d.badge?.toLowerCase()] || d.badge || t.badges?.sale || "Sale"}</span>
                      {/* Wishlist button on deal card */}
                      <button
                        style={{
                          position: "absolute", top: 10, right: 10,
                          width: 30, height: 30, borderRadius: "50%",
                          border: "1px solid #eee",
                          background: isWished ? "#ff3b81" : "#fff",
                          color: isWished ? "#fff" : "#ff3b81",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, zIndex: 2, transition: ".2s",
                        }}
                        onClick={(e) => { e.stopPropagation(); toggleWishlist && toggleWishlist(d); }}
                      >
                        <i className={isWished ? "fas fa-heart" : "far fa-heart"}></i>
                      </button>
                      <img src={d.imageUrl} alt={translatedName} loading="lazy" />
                    </div>
                    <div className="card-info">
                      <div className="card-title">{translatedName}</div>
                      <div className="card-seller">By {d.brand}</div>
                      <div className="card-price-row">
                        <span className="price-new">
                          {language === "ke" ? `KES ${cleanPrice(d.price)}` : `₹${cleanPrice(d.price)}`}
                        </span>
                        <span className="price-old">
                          {language === "ke" ? `KES ${cleanPrice(d.oldPrice)}` : `₹${cleanPrice(d.oldPrice)}`}
                        </span>
                      </div>
                      <div className="p-action-row" onClick={(e) => e.stopPropagation()}>
                        {qty > 0 ? (
                          <div className="qty-control" style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            background: "var(--green)", borderRadius: "8px", padding: "4px 8px",
                            marginTop: "8px", height: "38px", color: "white", fontWeight: 700
                          }}>
                            <button onClick={() => onDecreaseCart && onDecreaseCart(d._uid)}
                              style={{ background: "transparent", border: "none", color: "white", fontSize: "18px", cursor: "pointer", width: "30px" }}>
                              -
                            </button>
                            <span style={{ fontSize: "14px" }}>{qty}</span>
                            <button onClick={() => onAddCart && onAddCart(d)}
                              style={{ background: "transparent", border: "none", color: "white", fontSize: "18px", cursor: "pointer", width: "30px" }}>
                              +
                            </button>
                          </div>
                        ) : (
                          <button className="padd" onClick={() => onAddCart && onAddCart(d)} style={{ marginTop: "8px" }}>
                            <i className="fas fa-shopping-cart"></i> {t.home.add}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </section>

      {/* ── BANNER TRIO ── */}
      <div className="container">
        <div className="banners">
          <div className="bcard b1">
            <div className="btext">
              <h2>{t.home.banner1}</h2>
              <a href="#" className="bbtn" onClick={(e) => { e.preventDefault(); onCategorySelect && onCategorySelect("vegetables"); }}>{t.home.shopNow} <i className="fa-solid fa-arrow-right" style={{ fontSize: "8px" }}></i></a>
            </div>
            <div className="bimg"><img src="assets/fresh&clean.png" alt="" /></div>
          </div>
          <div className="bcard b2">
            <div className="btext">
              <h2>{t.home.banner2}</h2>
              <a href="#" className="bbtn" onClick={(e) => { e.preventDefault(); onCategorySelect && onCategorySelect("dairyProducts"); }}>{t.home.shopNow} <i className="fa-solid fa-arrow-right" style={{ fontSize: "8px" }}></i></a>
            </div>
            <div className="bimg"><img src="assets/healthy-breakfast.png" alt="" /></div>
          </div>
          <div className="bcard b3">
            <div className="btext">
              <h2>{t.home.banner3}</h2>
              <a href="#" className="bbtn" onClick={(e) => { e.preventDefault(); onCategorySelect && onCategorySelect("fruits"); }}>{t.home.shopNow} <i className="fa-solid fa-arrow-right" style={{ fontSize: "8px" }}></i></a>
            </div>
            <div className="bimg"><img src="assets/organic-food.png" alt="" /></div>
          </div>
        </div>
      </div>

      {/* ── SHOP BY CATEGORIES ── */}
      <section className="cat-section">
        <div className="container">
          <div className="sec-header">
            <div className="sec-title">{t.home.shopByCategory}</div>
            <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); onCategorySelect && onCategorySelect("all"); }}>
              {t.home.allCategories} <i className="fa-solid fa-chevron-right" style={{ fontSize: "10px" }}></i>
            </a>
          </div>
          <div className="cat-grid">
            {[
              { key: "dairyProducts",      img: "assets/category-1.png",  name: t.categories.dairyProducts },
              { key: "coolDrinks",         img: "assets/category-2.png",  name: t.categories.coolDrinks },
              { key: "bodyCare",           img: "assets/category-3.png",  name: t.categories.bodyCare },
              { key: "babyCare",           img: "assets/category-4.png",  name: t.categories.babyCare },
              { key: "instantFood",        img: "assets/category-5.png",  name: t.categories.instantFood },
              { key: "biscuitsAndCookies", img: "assets/category-6.png",  name: t.categories.biscuitsCookies },
              { key: "vegetables",         img: "assets/category-7.png",  name: t.categories.vegetables },
              { key: "fruits",             img: "assets/category-10.png", name: t.categories.freshFruits },
              { key: "feminineHygiene",    img: "assets/category-9.png",  name: t.categories.feminineHygiene },
            ].map((cat, i) => (
              <div key={i} className="catbox" style={{ cursor: "pointer" }} onClick={() => onCategorySelect && onCategorySelect(cat.key)}>
                <div className="catbox-icon"><img src={cat.img} alt="" /></div>
                <h5>{cat.name}</h5>
                <span>Shop now</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP SELLING / TRENDING / RECENTLY ADDED / TOP RATED ── */}
      <section>
        <div className="container">
          <div className="multicol">
            {[
              { title: t.home.topSelling,    items: multiCols.topSelling },
              { title: t.home.trending,       items: multiCols.trending },
              { title: t.home.recentlyAdded, items: multiCols.recentlyAdded },
              { title: t.home.topRated,      items: multiCols.topRated },
            ].map((col, ci) => (
              <div key={ci}>
                <div className="coltitle">{col.title}</div>
                {loading
                  ? Array.from({ length: 3 }).map((_, ii) => (
                      <div key={ii} style={{ display: "flex", gap: "10px", padding: "10px 0", alignItems: "center" }}>
                        <div style={{ width: 58, height: 58, borderRadius: 8, background: "#ececec", flexShrink: 0, animation: "pulse 1.4s infinite" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 12, background: "#ececec", borderRadius: 4, marginBottom: 6, animation: "pulse 1.4s infinite" }} />
                          <div style={{ height: 10, background: "#ececec", borderRadius: 4, width: "60%", animation: "pulse 1.4s infinite" }} />
                        </div>
                      </div>
                    ))
                  : col.items.map((item, ii) => {
                      const inCart  = cart.find((c) => c._uid === item._uid);
                      const qty     = inCart ? inCart.quantity : 0;
                      const isWished = wishlist.some((w) => w._uid === item._uid);
                      const translatedName = getTranslatedName(item.name);
                      return (
                        <div key={ii} className="mprod" style={{ cursor: "pointer" }} onClick={() => onOpenProduct && onOpenProduct(item)}>
                          <div className="mimg">
                            <img src={item.imageUrl} alt={translatedName} loading="lazy" />
                          </div>
                          <div className="minfo">
                            <h6>{translatedName}</h6>
                            <div className="pstars">⭐ {item.stars || "4.0"} <span>({item.reviews || 0})</span></div>
                            <div className="mbrand">{item.brand}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span className="mprice">
                                {language === "ke" ? `KES ${cleanPrice(item.price)}` : `₹${cleanPrice(item.price)}`}
                              </span>
                              {item.oldPrice && (
                                <span className="mpold">
                                  {language === "ke" ? `KES ${cleanPrice(item.oldPrice)}` : `₹${cleanPrice(item.oldPrice)}`}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
                              {qty > 0 ? (
                                <div style={{
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                  background: "var(--green)", borderRadius: "8px", padding: "2px 6px",
                                  height: "30px", color: "white", fontWeight: 700, flex: 1
                                }}>
                                  <button onClick={() => onDecreaseCart && onDecreaseCart(item._uid)}
                                    style={{ background: "transparent", border: "none", color: "white", fontSize: "16px", cursor: "pointer", width: "24px", lineHeight: 1 }}>
                                    -
                                  </button>
                                  <span style={{ fontSize: "13px" }}>{qty}</span>
                                  <button onClick={() => onAddCart && onAddCart(item)}
                                    style={{ background: "transparent", border: "none", color: "white", fontSize: "16px", cursor: "pointer", width: "24px", lineHeight: 1 }}>
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="padd"
                                  style={{ fontSize: 11, padding: "4px 10px", flex: 1 }}
                                  onClick={() => onAddCart && onAddCart(item)}
                                >
                                  <i className="fas fa-shopping-cart"></i> {t.home.add}
                                </button>
                              )}
                              <button
                                className="pwish"
                                style={{ position: "static", opacity: 1, width: 28, height: 28, fontSize: 12, flexShrink: 0, ...(isWished ? { background: "#ff3b81", color: "#fff" } : {}) }}
                                onClick={(e) => { e.stopPropagation(); toggleWishlist && toggleWishlist(item); }}
                              >
                                <i className={isWished ? "fas fa-heart" : "far fa-heart"}></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="promo-banner">
        <div className="banner-content">
          <h1>{t.home.stayHome}</h1>
          <p>{t.home.startShopping} <span>Prime Basket</span></p>
          <form className="subscribe" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder={t.home.emailPlaceholder} required />
            <button type="submit">{t.home.subscribe}</button>
          </form>
        </div>
        <div className="banner-images">
          <img className="img-person" src="assets/banner-9-min.png" alt="delivery person with groceries"
            onError={(e) => { e.target.style.background = "rgba(0,0,0,0.05)"; e.target.style.borderRadius = "8px"; e.target.style.minHeight = "220px"; }}
          />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features">
        <div className="container">
          <div className="feat-grid">
            {[
              { img: "assets/icon-1.png", title: t.features.bestPrices,     sub: t.features.bestPricesSub     },
              { img: "assets/icon-2.png", title: t.features.freeDelivery,   sub: t.features.freeDeliverySub   },
              { img: "assets/icon-3.png", title: t.features.greatDeal,      sub: t.features.greatDealSub      },
              { img: "assets/icon-4.png", title: t.features.wideAssortment, sub: t.features.wideAssortmentSub },
              { img: "assets/icon-5.png", title: t.features.easyReturns,    sub: t.features.easyReturnsSub    },
            ].map((f, i) => (
              <div key={i} className="feat-item">
                <div className="ficon"><img src={f.img} alt="" /></div>
                <div className="ftext">
                  <h5>{f.title}</h5>
                  <p>{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}