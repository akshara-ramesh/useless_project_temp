// App.js
import React, { useState } from "react";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    alert(`Logging in with: ${email}, ${password}`);
  };

  const handleSignup = () => {
    alert(`Signing up with: ${email}, ${password}`);
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "#f7f7f7"
    }}>
      <div style={{
        background: "#fff",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        width: "300px",
        textAlign: "center"
      }}>
        <h1 style={{ marginBottom: "1.5rem", color: "#333" }}>BunkBank</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            marginBottom: "1rem",
            border: "1px solid #ccc",
            borderRadius: "8px"
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            marginBottom: "1.5rem",
            border: "1px solid #ccc",
            borderRadius: "8px"
          }}
        />
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "0.6rem",
            background: "#4cafef",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            marginBottom: "0.5rem",
            cursor: "pointer"
          }}
        >
          Login
        </button>
        <button
          onClick={handleSignup}
          style={{
            width: "100%",
            padding: "0.6rem",
            background: "#34c759",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Signup
        </button>
      </div>
    </div>
  );
}
