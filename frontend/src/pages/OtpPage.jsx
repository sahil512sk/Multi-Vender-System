import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
const OTP_TTL = 1 * 60;

export default function OtpPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { setUser } = useAuth();

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
        if (data.user) setUser(data.user);

        setStatus("success");
        setMessage(data.message || "Verified!");

        setTimeout(() => navigate("/dashboard", { replace: true }), 900);
      } catch (err) {
        setStatus("error");
        setMessage(err.message);
      }
    },
    [digits, email, mobile, navigate, setUser]
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Verify your identity</h1>
          <p>Enter the 6-digit code sent to {maskedTo || "your contact"}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* OTP boxes */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                autoFocus={i === 0}
                disabled={isLoading || isSuccess}
                style={{
                  width: '44px',
                  height: '44px',
                  fontSize: '18px',
                  fontWeight: '600',
                  textAlign: 'center',
                  border: `2px solid ${
                    status === 'error' ? 'var(--danger)' :
                    status === 'success' ? 'var(--success)' :
                    d ? 'var(--text)' : 'var(--border)'
                  }`,
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxShadow: d ? '0 0 0 3px rgba(26,26,24,.08)' : 'none',
                }}
                onChange={(e) => handleInput(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onFocus={(e) => e.target.select()}
                onPaste={handlePaste}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {/* Timer */}
          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginBottom: '1rem' }}>
            {expired ? (
              <span style={{ color: 'var(--danger)' }}>Code expired</span>
            ) : (
              <>
                <span>Expires in </span>
                <span style={{ fontWeight: '600', color: 'var(--text)' }}>{mm}:{ss}</span>
              </>
            )}
          </div>

          {/* Feedback message */}
          {message && (
            <div className="form-error" style={{
              background: status === 'error' ? '#fef2f2' :
                          status === 'success' ? '#f0fdf4' : 'var(--bg)',
              borderColor: status === 'error' ? '#fecaca' :
                           status === 'success' ? '#bbf7d0' : 'var(--border)',
              color: status === 'error' ? 'var(--danger)' :
                     status === 'success' ? 'var(--success)' : 'var(--text)',
              marginBottom: '1rem',
            }}>
              {status === "error"   && "⚠ "}
              {status === "success" && "✓ "}
              {message}
            </div>
          )}

          {/* Submit button */}
          {/* <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || isSuccess || digits.join("").length < OTP_LEN}
          >
            {isLoading && <span className="spinner" />}
            {isSuccess  ? "✓ Verified!" :
             isLoading  ? "Verifying…"  :
             flow === "register" ? "Create Account" : "Sign In"}
          </button> */}
        </form>

        {/* Resend option */}
        <p className="auth-footer">
          Didn't receive it?&nbsp;
          <button
            onClick={handleResend}
            disabled={!expired || resending}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: expired ? 'var(--text)' : 'var(--muted)',
              textDecoration: expired ? 'underline' : 'none',
              cursor: expired && !resending ? 'pointer' : 'not-allowed',
              fontWeight: 500,
              fontSize: '13px',
              fontFamily: 'var(--font)',
              transition: 'opacity 0.15s',
            }}
          >
            {resending ? "Sending…" : expired ? "Resend code" : `Resend in ${mm}:${ss}`}
          </button>
        </p>
      </div>
    </div>
  );
}
