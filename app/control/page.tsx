"use client";

import {useState, useEffect} from "react";

export default function ControlPage() {
  const [openerWindow, setOpenerWindow] = useState<Window | null>(null);
  const [activeLight, setActiveLight] = useState<
    "red" | "yellow" | "blue" | "none"
  >("none");

  useEffect(() => {
    // 親ウィンドウへの参照を保持
    if (window.opener) {
      setOpenerWindow(window.opener);
    }
  }, []);

  const sendMessage = (light: "red" | "yellow" | "blue" | "none") => {
    if (openerWindow) {
      openerWindow.postMessage(
        {type: "LIGHT_CHANGE", light},
        window.location.origin
      );
      setActiveLight(light);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
        backgroundColor: "#1a1a1a",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{color: "#fff", marginBottom: "30px"}}>Signal Control</h1>

      <button
        onClick={() => sendMessage("red")}
        style={{
          width: "200px",
          height: "80px",
          fontSize: "24px",
          fontWeight: "bold",
          backgroundColor: activeLight === "red" ? "#ff3232" : "#661414",
          color: "#fff",
          border: activeLight === "red" ? "3px solid #ff6666" : "2px solid #444",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        RED
      </button>

      <button
        onClick={() => sendMessage("yellow")}
        style={{
          width: "200px",
          height: "80px",
          fontSize: "24px",
          fontWeight: "bold",
          backgroundColor: activeLight === "yellow" ? "#ffdc00" : "#665800",
          color: activeLight === "yellow" ? "#000" : "#fff",
          border:
            activeLight === "yellow" ? "3px solid #ffee66" : "2px solid #444",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        YELLOW
      </button>

      <button
        onClick={() => sendMessage("blue")}
        style={{
          width: "200px",
          height: "80px",
          fontSize: "24px",
          fontWeight: "bold",
          backgroundColor: activeLight === "blue" ? "#0096ff" : "#004466",
          color: "#fff",
          border:
            activeLight === "blue" ? "3px solid #66ccff" : "2px solid #444",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        BLUE
      </button>

      <button
        onClick={() => sendMessage("none")}
        style={{
          width: "200px",
          height: "80px",
          fontSize: "24px",
          fontWeight: "bold",
          backgroundColor: activeLight === "none" ? "#555" : "#2a2a2a",
          color: "#fff",
          border: activeLight === "none" ? "3px solid #888" : "2px solid #444",
          borderRadius: "10px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        NONE
      </button>
    </div>
  );
}
