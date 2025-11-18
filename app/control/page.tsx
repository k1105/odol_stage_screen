"use client";

import {useState, useEffect} from "react";

export default function ControlPage() {
  const [openerWindow, setOpenerWindow] = useState<Window | null>(null);
  const [activeLight, setActiveLight] = useState<
    "red" | "yellow" | "blue" | "none"
  >("none");
  const [danceActive, setDanceActive] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [circleRadius, setCircleRadius] = useState(20);
  const [bpmMultiplier, setBpmMultiplier] = useState(0.1);
  const [textVisible, setTextVisible] = useState(false);
  const [thankYouVisible, setThankYouVisible] = useState(false);

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

  const toggleDance = () => {
    const newDanceActive = !danceActive;
    setDanceActive(newDanceActive);
    if (openerWindow) {
      openerWindow.postMessage(
        {type: "DANCE_TOGGLE", active: newDanceActive},
        window.location.origin
      );
    }
  };

  const updateBpm = (value: number) => {
    setBpm(value);
    if (openerWindow) {
      openerWindow.postMessage(
        {type: "BPM_CHANGE", bpm: value},
        window.location.origin
      );
    }
  };

  const updateCircleRadius = (value: number) => {
    setCircleRadius(value);
    if (openerWindow) {
      openerWindow.postMessage(
        {type: "CIRCLE_RADIUS_CHANGE", radius: value},
        window.location.origin
      );
    }
  };

  const updateBpmMultiplier = (value: number) => {
    setBpmMultiplier(value);
    if (openerWindow) {
      openerWindow.postMessage(
        {type: "BPM_MULTIPLIER_CHANGE", multiplier: value},
        window.location.origin
      );
    }
  };

  const showText = () => {
    setTextVisible(true);
    if (openerWindow) {
      openerWindow.postMessage(
        {type: "TEXT_SHOW"},
        window.location.origin
      );
    }
  };

  const hideText = () => {
    setTextVisible(false);
    if (openerWindow) {
      openerWindow.postMessage(
        {type: "TEXT_HIDE"},
        window.location.origin
      );
    }
  };

  const showThankYou = () => {
    setThankYouVisible(true);
    if (openerWindow) {
      openerWindow.postMessage(
        {type: "THANKYOU_SHOW"},
        window.location.origin
      );
    }
  };

  const hideThankYou = () => {
    setThankYouVisible(false);
    if (openerWindow) {
      openerWindow.postMessage(
        {type: "THANKYOU_HIDE"},
        window.location.origin
      );
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "20px",
        backgroundColor: "#1a1a1a",
        fontFamily: "sans-serif",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <h1 style={{color: "#fff", marginBottom: "10px"}}>Signal Control</h1>

      <button
        onClick={() => sendMessage("red")}
        style={{
          width: "200px",
          height: "80px",
          fontSize: "24px",
          fontWeight: "bold",
          backgroundColor: activeLight === "red" ? "#ff3232" : "#661414",
          color: "#fff",
          border:
            activeLight === "red" ? "3px solid #ff6666" : "2px solid #444",
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

      <div
        style={{
          width: "100%",
          maxWidth: "300px",
          borderTop: "2px solid #444",
          paddingTop: "20px",
          marginTop: "10px",
        }}
      >
        <h2 style={{color: "#fff", marginBottom: "20px", fontSize: "20px"}}>
          Dance Control
        </h2>

        <button
          onClick={toggleDance}
          style={{
            width: "200px",
            height: "60px",
            fontSize: "20px",
            fontWeight: "bold",
            backgroundColor: danceActive ? "#ff6600" : "#663300",
            color: "#fff",
            border: danceActive ? "3px solid #ff9933" : "2px solid #444",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "all 0.2s",
            marginBottom: "20px",
          }}
        >
          {danceActive ? "DANCE ON" : "DANCE OFF"}
        </button>

        <div style={{marginBottom: "15px"}}>
          <label
            style={{
              color: "#fff",
              display: "block",
              marginBottom: "5px",
              fontSize: "14px",
            }}
          >
            BPM: {bpm}
          </label>
          <input
            type="range"
            min="60"
            max="1000"
            value={bpm}
            onChange={(e) => updateBpm(Number(e.target.value))}
            style={{width: "100%"}}
          />
        </div>

        <div style={{marginBottom: "15px"}}>
          <label
            style={{
              color: "#fff",
              display: "block",
              marginBottom: "5px",
              fontSize: "14px",
            }}
          >
            Circle Radius: {circleRadius}
          </label>
          <input
            type="range"
            min="5"
            max="100"
            value={circleRadius}
            onChange={(e) => updateCircleRadius(Number(e.target.value))}
            style={{width: "100%"}}
          />
        </div>

        <div style={{marginBottom: "15px"}}>
          <label
            style={{
              color: "#fff",
              display: "block",
              marginBottom: "5px",
              fontSize: "14px",
            }}
          >
            BPM Multiplier: {bpmMultiplier.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={bpmMultiplier}
            onChange={(e) => updateBpmMultiplier(Number(e.target.value))}
            style={{width: "100%"}}
          />
        </div>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "300px",
          borderTop: "2px solid #444",
          paddingTop: "20px",
          marginTop: "10px",
        }}
      >
        <h2 style={{color: "#fff", marginBottom: "20px", fontSize: "20px"}}>
          Text Control
        </h2>

        <div style={{display: "flex", gap: "10px", justifyContent: "center"}}>
          <button
            onClick={showText}
            style={{
              width: "140px",
              height: "60px",
              fontSize: "16px",
              fontWeight: "bold",
              backgroundColor: textVisible ? "#00cc66" : "#003322",
              color: "#fff",
              border: textVisible ? "3px solid #00ff88" : "2px solid #444",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            SHOW TEXT
          </button>

          <button
            onClick={hideText}
            style={{
              width: "140px",
              height: "60px",
              fontSize: "16px",
              fontWeight: "bold",
              backgroundColor: !textVisible ? "#cc0066" : "#330022",
              color: "#fff",
              border: !textVisible ? "3px solid #ff0088" : "2px solid #444",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            HIDE TEXT
          </button>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "300px",
          borderTop: "2px solid #444",
          paddingTop: "20px",
          marginTop: "10px",
        }}
      >
        <h2 style={{color: "#fff", marginBottom: "20px", fontSize: "20px"}}>
          Thank You (None only)
        </h2>

        <div style={{display: "flex", gap: "10px", justifyContent: "center"}}>
          <button
            onClick={showThankYou}
            disabled={activeLight !== "none"}
            style={{
              width: "140px",
              height: "60px",
              fontSize: "16px",
              fontWeight: "bold",
              backgroundColor:
                activeLight !== "none"
                  ? "#444"
                  : thankYouVisible
                  ? "#ff9900"
                  : "#663300",
              color: activeLight !== "none" ? "#888" : "#fff",
              border:
                activeLight !== "none"
                  ? "2px solid #666"
                  : thankYouVisible
                  ? "3px solid #ffcc66"
                  : "2px solid #444",
              borderRadius: "10px",
              cursor: activeLight !== "none" ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            SHOW
          </button>

          <button
            onClick={hideThankYou}
            disabled={activeLight !== "none"}
            style={{
              width: "140px",
              height: "60px",
              fontSize: "16px",
              fontWeight: "bold",
              backgroundColor:
                activeLight !== "none"
                  ? "#444"
                  : !thankYouVisible
                  ? "#cc0066"
                  : "#330022",
              color: activeLight !== "none" ? "#888" : "#fff",
              border:
                activeLight !== "none"
                  ? "2px solid #666"
                  : !thankYouVisible
                  ? "3px solid #ff0088"
                  : "2px solid #444",
              borderRadius: "10px",
              cursor: activeLight !== "none" ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            HIDE
          </button>
        </div>
      </div>
    </div>
  );
}
