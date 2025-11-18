"use client";

import {useEffect, useRef} from "react";
import p5 from "p5";

export default function P5Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // postMessageイベントリスナーの設定
    const handleMessage = (event: MessageEvent) => {
      // セキュリティ: 同じオリジンからのメッセージのみ受け付ける
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "LIGHT_CHANGE") {
        const light = event.data.light;
        if (p5InstanceRef.current) {
          // p5インスタンスにカスタムイベントを送信
          const customEvent = new CustomEvent("lightChange", {detail: {light}});
          window.dispatchEvent(customEvent);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    const sketch = (p: p5) => {
      const LAYERS = 12;
      const RADIUS_ACTIVE = 30;
      const RADIUS_INACTIVE = 60;
      const SPACING_FACTOR = 1.5;
      let activeLight: "red" | "yellow" | "blue" | "none" = "none";
      let targetLight: "red" | "yellow" | "blue" | "none" = "none";
      let transitionProgress: number = 1.0;
      let isAnimating: boolean = false;

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.fill(0, 200, 255);
        p.stroke(0);
        p.strokeWeight(1);

        // カスタムイベントリスナーを設定
        window.addEventListener("lightChange", ((event: CustomEvent) => {
          const newLight = event.detail.light;
          if (newLight && newLight !== targetLight) {
            targetLight = newLight;
            transitionProgress = 0;
            isAnimating = true;
          }
        }) as EventListener);
      };

      // キーボード操作は無効化（コントロールパネルからのみ操作）

      p.draw = () => {
        if (isAnimating) {
          transitionProgress += 0.05;
          if (transitionProgress >= 1.0) {
            transitionProgress = 1.0;
            activeLight = targetLight;
            isAnimating = false;
            // アニメーション終了後はloopを停止しない（アクティブなアニメーションを継続）
          }
        }

        const eased = easeInOutCubic(transitionProgress);

        p.background(0);

        const centerY = p.height / 2;

        const lights: Array<{color: "blue" | "yellow" | "red"; index: number}> =
          [
            {color: "blue", index: 0},
            {color: "yellow", index: 1},
            {color: "red", index: 2},
          ];

        const isAllInactive = targetLight === "none";
        const wasAllInactive = activeLight === "none";

        let currentX = 0;
        for (const light of lights) {
          const wasActive = activeLight === light.color;
          const willBeActive = targetLight === light.color;

          let width: number;
          let brightness: number;
          let circleRadius: number;

          if (isAllInactive && wasAllInactive) {
            // 全てinactiveの状態が継続
            width = p.width / 3;
            brightness = 0.0;
            circleRadius = RADIUS_INACTIVE;
          } else if (!wasAllInactive && isAllInactive) {
            // アクティブな状態 → 全てinactive
            const activeCircleWidth = p.height;
            const remainingWidth = p.width - activeCircleWidth;
            const inactiveCircleWidth = remainingWidth / 2;
            const allInactiveWidth = p.width / 3;

            if (wasActive) {
              width = p.lerp(activeCircleWidth, allInactiveWidth, eased);
              brightness = p.lerp(1.0, 0.0, eased);
              circleRadius = p.lerp(RADIUS_ACTIVE, RADIUS_INACTIVE, eased);
            } else {
              width = p.lerp(inactiveCircleWidth, allInactiveWidth, eased);
              brightness = 0.0;
              circleRadius = RADIUS_INACTIVE;
            }
          } else if (wasAllInactive && !isAllInactive) {
            // 全てinactive → アクティブな状態
            const activeCircleWidth = p.height;
            const remainingWidth = p.width - activeCircleWidth;
            const inactiveCircleWidth = remainingWidth / 2;
            const allInactiveWidth = p.width / 3;

            if (willBeActive) {
              width = p.lerp(allInactiveWidth, activeCircleWidth, eased);
              brightness = p.lerp(0.0, 1.0, eased);
              circleRadius = p.lerp(RADIUS_INACTIVE, RADIUS_ACTIVE, eased);
            } else {
              width = p.lerp(allInactiveWidth, inactiveCircleWidth, eased);
              brightness = 0.0;
              circleRadius = RADIUS_INACTIVE;
            }
          } else {
            // 通常の色切り替え
            const activeCircleWidth = p.height;
            const remainingWidth = p.width - activeCircleWidth;
            const inactiveCircleWidth = remainingWidth / 2;

            if (wasActive && !willBeActive) {
              width = p.lerp(activeCircleWidth, inactiveCircleWidth, eased);
              brightness = p.lerp(1.0, 0.0, eased);
              circleRadius = p.lerp(RADIUS_ACTIVE, RADIUS_INACTIVE, eased);
            } else if (!wasActive && willBeActive) {
              width = p.lerp(inactiveCircleWidth, activeCircleWidth, eased);
              brightness = p.lerp(0.0, 1.0, eased);
              circleRadius = p.lerp(RADIUS_INACTIVE, RADIUS_ACTIVE, eased);
            } else if (wasActive && willBeActive) {
              width = activeCircleWidth;
              brightness = 1.0;
              circleRadius = RADIUS_ACTIVE;
            } else {
              width = inactiveCircleWidth;
              brightness = 0.0;
              circleRadius = RADIUS_INACTIVE;
            }
          }

          const centerX = currentX + width / 2;

          const isActive = brightness > 0.5;

          drawPattern(
            p,
            centerX,
            centerY,
            width,
            light.color,
            brightness,
            circleRadius,
            isActive,
            isAllInactive
          );

          currentX += width;
        }
      };

      function easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }

      function drawPattern(
        pg: p5,
        centerX: number,
        centerY: number,
        allocatedWidth: number,
        color: "blue" | "yellow" | "red",
        brightness: number,
        radius: number,
        isActive: boolean,
        isAllInactive: boolean
      ) {
        const layers = LAYERS;
        const spacingFactor = SPACING_FACTOR;

        let baseColor: [number, number, number];
        if (color === "blue") {
          baseColor = [0, 150, 255];
        } else if (color === "yellow") {
          baseColor = [255, 220, 0];
        } else {
          baseColor = [255, 50, 50];
        }

        // 全てinactiveの時は横幅基準の正円、それ以外は縦100%
        let patternSize: number;
        let scaleX: number;
        let scaleY: number;

        if (isAllInactive) {
          // 全てinactive: 横幅基準の正円
          patternSize = allocatedWidth;
          scaleX = 1;
          scaleY = 1;
        } else {
          // 一つでもアクティブ: 縦100%で横方向に圧縮/拡大
          patternSize = p.height;
          scaleX = allocatedWidth / p.height;
          scaleY = 1;
        }

        // 小さい円を描画（アクティブ時のみ）
        if (isActive) {
          pg.noStroke();

          for (let i = 0; i < layers; i++) {
            const circleRadius = p.map(i, 0, layers - 1, 0, patternSize / 2.2);
            const circleSize = radius;
            const circumference = p.TWO_PI * circleRadius;
            const circlesPerLayer = p.max(
              6,
              p.floor(circumference / (circleSize * spacingFactor))
            );

            for (let j = 0; j < circlesPerLayer; j++) {
              const angle =
                (p.TWO_PI * j) / circlesPerLayer +
                ((i % 2) * p.PI) / circlesPerLayer;
              const x = centerX + p.cos(angle) * circleRadius * scaleX;
              const y = centerY + p.sin(angle) * circleRadius * scaleY;

              // ノイズとsinを使ったアニメーション（最適化版）
              const time = p.millis() / 1000;
              const noiseVal = p.noise(i / 10, j / 10, time);
              const alpha = 255 * brightness * (0.5 / (noiseVal + 1));

              const r = p.lerp(0, baseColor[0], brightness);
              const g = p.lerp(0, baseColor[1], brightness);
              const b = p.lerp(0, baseColor[2], brightness);
              pg.fill(r, g, b, alpha);

              // ランダムとsinを使ってちらつき効果
              if (p.random() < 0.5 * (p.sin(p.millis() / 500) + 1)) {
                const animatedSize = circleSize * (0.8 + 0.4 * noiseVal);
                pg.ellipse(x, y, animatedSize, animatedSize);
              }
            }
          }
        }

        // 非アクティブ時のみ白いアウトラインを描画
        if (!isActive) {
          pg.noFill();
          pg.stroke(255);
          pg.strokeWeight(3);
          pg.push();
          pg.translate(centerX, centerY);
          pg.scale(scaleX, scaleY);
          pg.ellipse(0, 0, (patternSize / 2.2) * 2, (patternSize / 2.2) * 2);
          pg.pop();
        }
      }

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        p.redraw();
      };
    };

    p5InstanceRef.current = new p5(sketch, canvasRef.current);

    return () => {
      window.removeEventListener("message", handleMessage);
      p5InstanceRef.current?.remove();
    };
  }, []);

  return <div ref={canvasRef} style={{width: "100%", height: "100%"}} />;
}
