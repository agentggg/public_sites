import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/glassLogo.jpg"; // adjust path as needed

// const ipAddress = "https://allnations-agentofgod.pythonanywhere.com";
const ipAddress = "http://localhost:8000";


export default function Login() {
  const [username, setUsername] = useState("cisco");
  const [password, setPassword] = useState("cisco");
  const [errorVisible, setErrorVisible] = useState(false);

  const handleLogin = async () => {
    setErrorVisible(false);

    try {
      const response = await fetch(`${ipAddress}/login_verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error("Invalid login");

      const data = await response.json();
      localStorage.setItem("authToken", JSON.stringify(data));

      // Save device token
      await fetch(`${ipAddress}/save_push_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          deviceMake: "Computer",
          deviceModel: "Web Browser",
          token: "NOT_APPLICABLE",
        }),
      });

      window.location.href = "/"; // navigate to send page
    } catch (err) {
      console.error("Login error:", err);
      setErrorVisible(true);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "#000", height: "100vh", color: "#fff" }}
    >
      <div
        className="login-container text-center"
        style={{
          maxWidth: "400px",
          padding: "2rem",
          borderRadius: "10px",
          borderColor: 'white',
        //   backgroundColor: "#1a1a1a",
          boxShadow: "0 0 15px rgba(255, 255, 255, 0.05)",
        }}
      >
        <h2 className="mb-3 text-light">Reaching the Nations</h2>
        <img
          src={logo}
          alt="Logo"
          className="mb-3 rounded"
          width="150"
        />
        <div className="form-floating mb-3 text-dark">
          <input
            type="text"
            className="form-control"
            id="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="username">Username</label>
        </div>
        <div className="form-floating mb-3 text-dark">
          <input
            type="password"
            className="form-control"
            id="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label htmlFor="password">Password</label>
        </div>
        <button
          className="btn w-100"
          style={{
            backgroundColor: "#ea5a28",
            color: "#000",
            fontWeight: "bold",
          }}
          onClick={handleLogin}
        >
          Login
        </button>
        {errorVisible && (
          <div className="text-danger mt-3">
            ❌ Wrong username or password
          </div>
        )}
      </div>
    </div>
  );
}