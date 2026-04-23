// src/components/Layout.jsx
import TopBar from "./TopBar";
import Header from "./Header";
import Footer from "./Footer";
import ChatbotWidget from "./ChatbotWidget";

export default function Layout({
  children,
  onAccountClick, isLoggedIn, user,
  onCategorySelect, onLogoClick,
  cartCount = 0, wishlistCount = 0,
  onCartClick, onWishlistClick,
  onOpenProduct,
  onFooterNavigate,
  // Language
  language = "en",
  onLanguageChange,
  // Cart/wishlist state for chatbot
  cart = [],
  wishlist = [],
  onAddToCart,
  toggleWishlist,
  onRemoveFromCart,
  onUpdateCartQty,
  onClearCart,
  // Notifications
  notifications = [],
  markAllRead,
  currentPage = "home"
}) {
  return (
    <>
      <TopBar 
        language={language} 
        onLanguageChange={onLanguageChange}
        isLoggedIn={isLoggedIn}
        user={user}
      />
      <Header
        onAccountClick={onAccountClick}
        isLoggedIn={isLoggedIn}
        user={user}
        onCategorySelect={onCategorySelect}
        onLogoClick={onLogoClick}
        onBack={onLogoClick}
        currentPage={currentPage}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={onCartClick}
        onWishlistClick={onWishlistClick}
        onOpenProduct={onOpenProduct}
        language={language}
        onLanguageChange={onLanguageChange}
        notifications={notifications}
        markAllRead={markAllRead}
      />
      <main>{children}</main>
      <Footer onNavigate={onFooterNavigate} language={language} />

      <ChatbotWidget
        onGoCart={onCartClick}
        onGoWishlist={onWishlistClick}
        cart={cart}
        wishlist={wishlist}
        onAddToCart={onAddToCart}
        toggleWishlist={toggleWishlist}
        onRemoveFromCart={onRemoveFromCart}
        onUpdateCartQty={onUpdateCartQty}
        onClearCart={onClearCart}
        language={language}
      />
    </>
  );
}