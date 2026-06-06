import { useState } from "react";

const API_BASE = "https://campus-hub-s2kw.onrender.com/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please fill in both fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Invalid username or password.");
      } else {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        if (onLogin) onLogin(data.access);
      }
    } catch {
      setError("Cannot connect to server. Is Django running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo mark */}
        <div style={styles.logoWrap}>
          <div style={styles.logoMark}>
            <span style={styles.logoLetter}>C</span>
          </div>
        </div>

        <h1 style={styles.title}>Campus Hub</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...styles.input, paddingRight: "44px" }}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                style={styles.eyeBtn}
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>

        <p style={styles.hint}>
          Default admin: <code style={styles.code}>admin / admin123</code>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f1117",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
    padding: "1rem",
  },
  card: {
    background: "#1a1d27",
    border: "1px solid #2a2d3a",
    borderRadius: "20px",
    padding: "2.5rem 2rem",
    width: "100%",
    maxWidth: "380px",
    textAlign: "center",
  },
  logoWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1.25rem",
  },
  logoMark: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    color: "#fff",
    fontWeight: "700",
    fontSize: "22px",
    fontFamily: "'DM Sans', sans-serif",
  },
  title: {
    color: "#f0f0f5",
    fontSize: "22px",
    fontWeight: "700",
    margin: "0 0 6px",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    color: "#6b6f85",
    fontSize: "14px",
    margin: "0 0 2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    textAlign: "left",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    color: "#9ca0b8",
    fontSize: "13px",
    fontWeight: "500",
  },
  input: {
    background: "#0f1117",
    border: "1px solid #2a2d3a",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#f0f0f5",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
    fontFamily: "'DM Sans', sans-serif",
  },
  eyeBtn: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
    lineHeight: 1,
  },
  error: {
    background: "#2d1a1a",
    border: "1px solid #5c2a2a",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "#f87171",
    fontSize: "13px",
  },
  btn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
    fontFamily: "'DM Sans', sans-serif",
    transition: "transform 0.1s",
  },
  hint: {
    marginTop: "1.5rem",
    color: "#4a4e63",
    fontSize: "12px",
  },
  code: {
    background: "#0f1117",
    padding: "2px 6px",
    borderRadius: "4px",
    color: "#6b6f85",
    fontSize: "11px",
  },
};
