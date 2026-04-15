import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuthCallback() {
  const [searchParams]     = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate           = useNavigate();
  const called             = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get("token") || new URLSearchParams(window.location.search).get("token");
    const error = searchParams.get("error") || new URLSearchParams(window.location.search).get("error");

    console.log("=== OAuthCallback ===");
    console.log("rawSearch:", window.location.search);
    console.log("token:", token ? "YES ✅" : "NO ❌");
    console.log("error:", error);

    if (error) {
      navigate("/login?error=" + error, { replace: true });
      return;
    }

    if (!token) {
      console.log("❌ Token නැහැ → /login");
      navigate("/login", { replace: true });
      return;
    }

    console.log("loginWithToken calling...");
    loginWithToken(token)
      .then((userData) => {
        console.log("loginWithToken result:", userData);
        console.log("userData null?", userData === null);

        if (!userData) {
          console.log("❌ userData null → /login");
          navigate("/login", { replace: true });
          return;
        }
        setTimeout(() => {
          const roles = userData.roles || [];
          console.log("roles:", roles);
          if (roles.includes("ROLE_ADMIN")) {
            navigate("/admin", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }, 100);
      })
      .catch((err) => {
        console.log("❌ CATCH ERROR:", err?.message, err?.response?.status);
        navigate("/login", { replace: true });
      });

  }, [loginWithToken, navigate, searchParams]);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#060812", gap: 16,
    }}>
      <div style={{
        width: 44, height: 44,
        border: "3px solid #1e2a3a",
        borderTop: "3px solid #4f6fff",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: "#6b7280", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
        Signing you in...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
