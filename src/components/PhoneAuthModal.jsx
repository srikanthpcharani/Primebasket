import { useState } from "react";
import "./PhoneLoginModal.css";
import { sendDemoPhoneOtp, verifyDemoPhoneOtp } from "../utils/demoPhoneAuth";
import { useT } from "../i18n/translations";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Country list with flag, dial code, max digits
const COUNTRIES = [
  { code: "KE", flagSrc: "https://flagcdn.com/w20/ke.png", dial: "+254", name: "Kenya", digits: 9,  placeholder: "7XXXXXXXX"  },
  { code: "IN", flagSrc: "https://flagcdn.com/w20/in.png", dial: "+91",  name: "India", digits: 10, placeholder: "9XXXXXXXXX" },
];

export default function PhoneAuthModal({
  isOpen,
  onClose,
  apiBaseUrl,
  onLoginSuccess,
  redirectPath,
  language = "en",
}) {
  const t = useT(language);

  // Auto-select country from language
  const defaultCountry = language === "ke"
    ? COUNTRIES.find(c => c.code === "KE")
    : COUNTRIES.find(c => c.code === "IN");

  const [step, setStep] = useState("PHONE");
  const [digits, setDigits] = useState("");          // only the number part
  const [country, setCountry] = useState(defaultCountry);
  const [showDropdown, setShowDropdown] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  const baseUrl = apiBaseUrl || API_BASE_URL;

  // Full E.164 phone
  const fullPhone = () => `${country.dial}${digits}`;

  const isValidPhone = () => digits.replace(/\D/g, "").length === country.digits;

  const resetForm = () => {
    setStep("PHONE");
    setDigits("");
    setOtp("");
    setError("");
    setDevOtp("");
    setShowDropdown(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleDigitsChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, country.digits);
    setDigits(raw);
    setError("");
  };

  const handleCountrySelect = (c) => {
    setCountry(c);
    setDigits("");
    setShowDropdown(false);
    setError("");
  };

  const performSendOtp = async () => {
    setError("");
    setLoading(true);
    const phone = fullPhone();
    try {
      if (!isValidPhone()) {
        throw new Error(`Enter a valid ${country.digits}-digit mobile number.`);
      }

      const response = await fetch(`${baseUrl}/api/auth/send-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "LOGIN" }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
      if (data.devOtp || data.otp) setDevOtp(data.devOtp || data.otp);
      setStep("OTP");
    } catch (err) {
      if (err instanceof TypeError && isValidPhone()) {
        try {
          const fallback = await sendDemoPhoneOtp({ phone, purpose: "LOGIN" });
          setDevOtp(fallback.otp || "");
          setStep("OTP");
          setError("");
        } catch (fb) {
          setError(fb.message || t.auth.serverError);
        }
      } else {
        setError(err.message || t.auth.serverError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => { e.preventDefault(); await performSendOtp(); };
  const handleResendOtp = async () => { await performSendOtp(); };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!/^\d{6}$/.test(otp.trim())) throw new Error(t.auth.invalidOtp);

      let data;
      try {
        const response = await fetch(`${baseUrl}/api/auth/verify-phone-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: fullPhone(), otp: otp.trim() }),
        });
        data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
      } catch (ne) {
        if (ne instanceof TypeError) {
          data = await verifyDemoPhoneOtp({ phone: fullPhone(), otp: otp.trim() });
          setDevOtp("");
        } else throw ne;
      }

      if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));
      if (data?.accessToken) localStorage.setItem("accessToken", data.accessToken);
      if (data?.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);

      if (typeof onLoginSuccess === "function") onLoginSuccess(data);
      if (redirectPath) window.location.assign(redirectPath);
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof TypeError ? t.auth.serverError : err.message || t.auth.invalidOtp);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => { setStep("PHONE"); setOtp(""); setError(""); setDevOtp(""); };

  if (!isOpen) return null;

  return (
    <div className="phone-login-overlay" onClick={handleClose}>
      <div className="phone-login-modal" onClick={(e) => e.stopPropagation()}>

        {/* Left – video/logo panel */}
        <div className="phone-login-video">
          <video autoPlay loop muted playsInline className="modal-video">
            <source src="/thelogovideo.mp4" type="video/mp4" />
          </video>
          <div className="video-overlay"></div>
        </div>

        {/* Right – form panel */}
        <div className="phone-login-form-container">
          <button className="modal-close-btn" onClick={handleClose}>×</button>

          <div className="phone-login-content">
            <h3>{step === "PHONE" ? t.auth.signIn : t.auth.verifyOtp}</h3>

            {step === "PHONE" && (
              <div className="phone-instruction">{t.auth.mobileNumber}</div>
            )}

            {error && <div className="error-message">{error}</div>}
            {devOtp && (
              <div className="dev-otp-display">
                <strong>OTP:</strong> {devOtp}
              </div>
            )}

            {/* ── PHONE STEP ── */}
            {step === "PHONE" ? (
              <form onSubmit={handleSendOtp} style={{ width: "100%" }}>

                {/* Input wrapper — position:relative so dropdown anchors right here */}
                <div style={{ position: "relative", width: "100%" }}>

                  {/* Split input */}
                  <div className="phone-split-input">

                    {/* Country selector */}
                    <button
                      type="button"
                      className="country-selector"
                      onClick={() => setShowDropdown(d => !d)}
                      disabled={loading}
                    >
                      <img
                        src={country.flagSrc}
                        alt={country.code}
                        className="country-flag-img"
                      />
                      <span className="country-dial">{country.dial}</span>
                      <span className="country-caret">▾</span>
                    </button>

                    <div className="phone-divider" />

                    <input
                      type="tel"
                      className="phone-digits-input"
                      value={digits}
                      onChange={handleDigitsChange}
                      placeholder={country.placeholder}
                      maxLength={country.digits}
                      required
                      disabled={loading}
                      autoFocus
                      inputMode="numeric"
                    />
                  </div>

                  {/* Dropdown — position:absolute relative to wrapper above */}
                  {showDropdown && (
                    <div className="country-dropdown">
                      {COUNTRIES.map(c => (
                        <div
                          key={c.code}
                          className={`country-option${c.code === country.code ? " active" : ""}`}
                          onClick={() => handleCountrySelect(c)}
                        >
                          <img src={c.flagSrc} alt={c.code} className="country-flag-img" />
                          <span className="country-option-name">{c.name}</span>
                          <span className="country-option-dial">{c.dial}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress dots */}
                <div className="phone-dots">
                  {Array.from({ length: country.digits }).map((_, i) => (
                    <div key={i} className={`phone-dot${i < digits.length ? " filled" : ""}`} />
                  ))}
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading || !isValidPhone()}
                >
                  {loading ? t.auth.sending : t.auth.sendOtp}
                </button>

                <p className="phone-terms">
                  By continuing, you agree to our{" "}
                  <span style={{ textDecoration: "underline", cursor: "pointer" }}>Terms</span>{" "}
                  &amp;{" "}
                  <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>
                </p>
              </form>

            ) : (
              /* ── OTP STEP ── */
              <form onSubmit={handleVerifyOtp} style={{ width: "100%" }}>
                <div className="otp-sent-message">
                  {t.auth.otpSentTo} <strong>{fullPhone()}</strong>
                </div>

                {/* 6-box OTP entry like Amazon */}
                <div className="otp-boxes">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      id={`otp-box-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`otp-box${otp[i] ? " filled" : ""}`}
                      value={otp[i] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (!val) {
                          setOtp(prev => prev.slice(0, i) + prev.slice(i + 1));
                          return;
                        }
                        const next = (otp.slice(0, i) + val + otp.slice(i + 1)).slice(0, 6);
                        setOtp(next);
                        // Auto-focus next box
                        const nb = document.getElementById(`otp-box-${i + 1}`);
                        if (nb) nb.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[i]) {
                          const pb = document.getElementById(`otp-box-${i - 1}`);
                          if (pb) pb.focus();
                        }
                      }}
                      autoFocus={i === 0}
                      disabled={loading}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? t.auth.verifying : t.auth.verifySignIn}
                </button>

                <div className="otp-actions">
                  <button type="button" className="link-btn" onClick={handleBackToPhone}>
                    ← {t.auth.changeNumber}
                  </button>
                  <button type="button" className="link-btn" onClick={handleResendOtp} disabled={loading}>
                    {t.auth.resendOtp}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
