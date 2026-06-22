"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Incorrect email or password");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--c-bg)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--c-border)",
          borderRadius: 16,
          padding: "2rem",
          width: "100%",
          maxWidth: 360,
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "var(--c-muted)",
            marginBottom: 4,
          }}
        >
          Nomichi
        </p>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--c-earth)",
            marginBottom: 2,
          }}
        >
          Team login
        </h1>
        <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 24 }}>
          Admin access only
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--c-sub)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="team@nomichi.com"
              required
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid var(--c-border)",
                borderRadius: 10,
                fontSize: 13,
                outline: "none",
                color: "var(--c-text)",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--c-sub)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Password
            </label>

            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "9px 40px 9px 12px",
                  border: "1px solid var(--c-border)",
                  borderRadius: 10,
                  fontSize: 13,
                  outline: "none",
                  color: "var(--c-text)",
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#C0392B", marginBottom: 12 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              background: "var(--c-accent)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
