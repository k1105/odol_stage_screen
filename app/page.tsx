"use client";

import dynamic from "next/dynamic";
import {useEffect} from "react";

const P5Canvas = dynamic(() => import("./components/P5Canvas"), {
  ssr: false,
});

export default function Home() {
  const openControlWindow = () => {
    window.open(
      "/control",
      "Control Window",
      "width=400,height=600,resizable=yes"
    );
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "o" || event.key === "O") {
        openControlWindow();
      }
    };

    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <P5Canvas />
    </div>
  );
}
