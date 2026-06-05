import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/* ── tiny helper: call your existing axios instance or swap in fetch ── */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

/* ── OTP_LENGTH ───────────────────────────────────────────────── */
const OTP_LEN = 6;
const OTP_TTL = 5 * 60;

export default function OtpPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  /* router state set by LoginPage / RegisterPage */
  const { email, mobile, flow = "login" } =
    location.state || {};

  const [digits,   setDigits]   = useState(Array(OTP_LEN).fill(""));
  const [status,   setStatus]   = useState("idle"); // idle | loading | error | success
  const [message,  setMessage]  = useState("");
  const [seconds,  setSeconds]  = useState(OTP_TTL);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  /* ── countdown ────────────────────────────────────────────── */
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const expired = seconds <= 0;

  /* ── focus helpers ────────────────────────────────────────── */
  const focusBox = (i) => inputRefs.current[i]?.focus();

  const handleKeyDown = (e, i) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        const next = [...digits];
        next[i - 1] = "";
        setDigits(next);
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft"  && i > 0)          focusBox(i - 1);
    else if   (e.key === "ArrowRight" && i < OTP_LEN - 1) focusBox(i + 1);
  };

  const handleInput = (e, i) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    if (!val) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (i < OTP_LEN - 1) focusBox(i + 1);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!pasted) return;
    const next = Array(OTP_LEN).fill("");
    pasted.split("").forEach((c, i) => (next[i] = c));
    setDigits(next);
    focusBox(Math.min(pasted.length, OTP_LEN - 1));
  };

  /* ── submit ───────────────────────────────────────────────── */
  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      const otp = digits.join("");
      if (otp.length < OTP_LEN) {
        setStatus("error");
        setMessage("Please enter the complete 6-digit code.");
        return;
      }
      setStatus("loading");
      setMessage("");
      try {
        const payload = { otp, ...(email ? { email } : { mobile }) };
        const data = await apiPost("/auth/verify-otp", payload);

        /* store token */
        if (data.token) localStorage.setItem("token", data.token);

        setStatus("success");
        setMessage(data.message || "Verified!");

        setTimeout(() => navigate("/dashboard"), 900);
      } catch (err) {
        setStatus("error");
        setMessage(err.message);
      }
    },
    [digits, email, mobile, navigate]
  );

  /* auto-submit when all filled */
  useEffect(() => {
    if (digits.every(Boolean)) handleSubmit();
  }, [digits]); // eslint-disable-line

  /* ── resend ───────────────────────────────────────────────── */
  const handleResend = async () => {
    if (!expired || resending) return;
    setResending(true);
    setMessage("");
    setStatus("idle");
    try {
      await apiPost("/auth/resend-otp", { ...(email ? { email } : { mobile }) });
      setDigits(Array(OTP_LEN).fill(""));
      setSeconds(OTP_TTL);
      focusBox(0);
      setMessage("A new code has been sent.");
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    } finally {
      setResending(false);
    }
  };

  /* ── masked identity ──────────────────────────────────────── */
  const maskedTo = email
    ? email.replace(/(.{2}).+(@.+)/, "$1•••$2")
    : mobile?.replace(/(\d{2})\d+(\d{3})/, "$1•••••$2");

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #0a0a0f;
          --surface:   #12121a;
          --border:    rgba(255,255,255,0.08);
          --accent:    #6ee7f7;
          --accent2:   #a78bfa;
          --text:      #e8e8f0;
          --muted:     #6b6b80;
          --error:     #f87171;
          --success:   #4ade80;
          --glow:      0 0 24px rgba(110,231,247,0.18);
        }

        body { background: var(--bg); }

        .otp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          font-family: 'Syne', sans-serif;
          padding: 1rem;
          position: relative;
          overflow: hidden;
        }

        /* ── grid bg ── */
        .otp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(110,231,247,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(110,231,247,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        /* ── blobs ── */
        .blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .blob-1 {
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(110,231,247,0.12) 0%, transparent 70%);
          top: -80px; right: -60px;
          animation: floatA 8s ease-in-out infinite;
        }
        .blob-2 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%);
          bottom: -60px; left: -40px;
          animation: floatB 10s ease-in-out infinite;
        }

        @keyframes floatA {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(-20px, 20px); }
        }
        @keyframes floatB {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(20px, -15px); }
        }

        /* ── card ── */
        .otp-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 44px 40px 40px;
          animation: cardIn 0.5s cubic-bezier(.16,1,.3,1) both;
        }

        @keyframes cardIn {
          from { opacity:0; transform: translateY(24px) scale(.97); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }

        /* top accent line */
        .otp-card::before {
          content: '';
          position: absolute;
          top: 0; left: 20%; right: 20%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          border-radius: 0 0 2px 2px;
        }

        /* ── icon ── */
        .otp-icon {
          width: 52px; height: 52px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, rgba(110,231,247,0.15), rgba(167,139,250,0.1));
          border: 1px solid rgba(110,231,247,0.2);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .otp-icon svg { width: 24px; height: 24px; color: var(--accent); }

        /* ── text ── */
        .otp-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text);
          text-align: center;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }

        .otp-sub {
          font-size: 0.82rem;
          color: var(--muted);
          text-align: center;
          line-height: 1.55;
          margin-bottom: 32px;
          font-family: 'DM Mono', monospace;
          font-weight: 300;
        }
        .otp-sub strong {
          color: var(--accent);
          font-weight: 500;
        }

        /* ── boxes ── */
        .otp-boxes {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 28px;
        }

        .otp-box {
          width: 52px; height: 58px;
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          text-align: center;
          font-size: 1.4rem;
          font-family: 'DM Mono', monospace;
          font-weight: 500;
          color: var(--text);
          outline: none;
          caret-color: var(--accent);
          transition: border-color .18s, box-shadow .18s, background .18s;
        }
        .otp-box:focus {
          border-color: var(--accent);
          background: rgba(110,231,247,0.05);
          box-shadow: var(--glow);
        }
        .otp-box.filled {
          border-color: rgba(110,231,247,0.5);
          background: rgba(110,231,247,0.04);
        }
        .otp-box.error-box {
          border-color: var(--error);
          box-shadow: 0 0 16px rgba(248,113,113,0.15);
          animation: shake .3s ease;
        }
        .otp-box.success-box {
          border-color: var(--success);
          background: rgba(74,222,128,0.06);
          box-shadow: 0 0 16px rgba(74,222,128,0.15);
        }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-4px); }
          75%      { transform: translateX(4px); }
        }

        /* separator dot */
        .otp-sep {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: var(--muted);
          align-self: center;
          flex-shrink: 0;
        }

        /* ── timer ── */
        .otp-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-family: 'DM Mono', monospace;
          font-size: 0.78rem;
          color: var(--muted);
          margin-bottom: 24px;
        }
        .otp-timer .timer-val {
          font-weight: 500;
          color: ${`var(--text)`};
          background: rgba(255,255,255,0.05);
          padding: 2px 8px;
          border-radius: 6px;
          letter-spacing: 0.06em;
        }
        .otp-timer.expired .timer-val { color: var(--error); }

        /* ── btn ── */
        .otp-btn {
          width: 100%;
          height: 50px;
          background: linear-gradient(135deg, rgba(110,231,247,0.9), rgba(167,139,250,0.85));
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: #0a0a0f;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: opacity .2s, transform .15s;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }
        .otp-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .otp-btn:not(:disabled):hover {
          transform: translateY(-1px);
          opacity: 0.92;
        }
        .otp-btn:not(:disabled):active { transform: scale(.99); }

        /* ripple on btn */
        .otp-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
          transform: translateX(-100%);
        }
        .otp-btn:not(:disabled):hover::after {
          animation: shimmer .5s ease forwards;
        }
        @keyframes shimmer {
          to { transform: translateX(100%); }
        }

        /* ── resend ── */
        .otp-resend {
          text-align: center;
          font-size: 0.8rem;
          color: var(--muted);
          font-family: 'DM Mono', monospace;
        }
        .otp-resend button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--accent);
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: opacity .2s;
        }
        .otp-resend button:disabled {
          color: var(--muted);
          cursor: not-allowed;
          text-decoration: none;
        }
        .otp-resend button:not(:disabled):hover { opacity: 0.75; }

        /* ── feedback ── */
        .otp-feedback {
          font-size: 0.78rem;
          font-family: 'DM Mono', monospace;
          text-align: center;
          margin-bottom: 16px;
          padding: 10px 14px;
          border-radius: 10px;
          animation: fadeUp .25s ease both;
        }
        @keyframes fadeUp {
          from { opacity:0; transform: translateY(6px); }
          to   { opacity:1; transform: translateY(0); }
        }
        .otp-feedback.error {
          color: var(--error);
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
        }
        .otp-feedback.success {
          color: var(--success);
          background: rgba(74,222,128,0.08);
          border: 1px solid rgba(74,222,128,0.2);
        }
        .otp-feedback.info {
          color: var(--accent);
          background: rgba(110,231,247,0.07);
          border: 1px solid rgba(110,231,247,0.18);
        }

        /* ── flow badge ── */
        .flow-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 500;
          color: var(--accent2);
          background: rgba(167,139,250,0.1);
          border: 1px solid rgba(167,139,250,0.2);
          border-radius: 20px;
          padding: 3px 10px;
          margin: 0 auto 18px;
          width: fit-content;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .flow-badge::before {
          content: '';
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--accent2);
          animation: pulse 1.5s ease infinite;
        }
        @keyframes pulse {
          0%,100% { opacity:1; }
          50%      { opacity:.4; }
        }

        /* ── spinner ── */
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(10,10,15,0.3);
          border-top-color: #0a0a0f;
          border-radius: 50%;
          animation: spin .6s linear infinite;
          display: inline-block;
          vertical-align: middle;
          margin-right: 6px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 440px) {
          .otp-card { padding: 36px 22px 32px; }
          .otp-box  { width: 44px; height: 52px; font-size: 1.2rem; }
        }
      `}</style>

      <div className="otp-root">
        <div className="blob blob-1" />
        <div className="blob blob-2" />

        <div className="otp-card">

          {/* flow badge */}
          <div className="flow-badge">
            {flow === "register" ? "✦ Sign Up" : "✦ Sign In"}
          </div>

          {/* lock icon */}
          <div className="otp-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="12" cy="16" r="1.2" fill="currentColor" />
            </svg>
          </div>

          <h1 className="otp-title">Check your {email ? "inbox" : "messages"}</h1>
          <p className="otp-sub">
            We sent a 6-digit code to<br />
            <strong>{maskedTo || "your contact"}</strong>
          </p>

          {/* OTP boxes */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="otp-boxes" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <>
                  {i === 3 && <div key="sep" className="otp-sep" />}
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    autoFocus={i === 0}
                    disabled={isLoading || isSuccess}
                    className={[
                      "otp-box",
                      d ? "filled" : "",
                      status === "error"   ? "error-box"   : "",
                      status === "success" ? "success-box" : "",
                    ].filter(Boolean).join(" ")}
                    onChange={(e) => handleInput(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Digit ${i + 1}`}
                  />
                </>
              ))}
            </div>

            {/* timer */}
            <div className={`otp-timer${expired ? " expired" : ""}`}>
              {expired ? (
                <span>Code expired</span>
              ) : (
                <>
                  <span>Expires in</span>
                  <span className="timer-val">{mm}:{ss}</span>
                </>
              )}
            </div>

            {/* feedback */}
            {message && (
              <div className={`otp-feedback ${
                status === "error"   ? "error"   :
                status === "success" ? "success" : "info"
              }`}>
                {status === "error"   && "⚠ "}
                {status === "success" && "✓ "}
                {message}
              </div>
            )}

            {/* submit */}
            <button
              type="submit"
              className="otp-btn"
              disabled={isLoading || isSuccess || digits.join("").length < OTP_LEN}
            >
              {isLoading && <span className="spinner" />}
              {isSuccess  ? "✓ Verified!" :
               isLoading  ? "Verifying…"  :
               flow === "register" ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* resend */}
          <p className="otp-resend">
            Didn't receive it?&nbsp;
            <button
              onClick={handleResend}
              disabled={!expired || resending}
              type="button"
            >
              {resending ? "Sending…" : expired ? "Resend code" : `Resend in ${mm}:${ss}`}
            </button>
          </p>

        </div>
      </div>
    </>
  );
}
