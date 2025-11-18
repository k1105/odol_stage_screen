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
      } else if (event.data.type === "DANCE_TOGGLE") {
        const customEvent = new CustomEvent("danceToggle", {
          detail: {active: event.data.active},
        });
        window.dispatchEvent(customEvent);
      } else if (event.data.type === "BPM_CHANGE") {
        const customEvent = new CustomEvent("bpmChange", {
          detail: {bpm: event.data.bpm},
        });
        window.dispatchEvent(customEvent);
      } else if (event.data.type === "CIRCLE_RADIUS_CHANGE") {
        const customEvent = new CustomEvent("circleRadiusChange", {
          detail: {radius: event.data.radius},
        });
        window.dispatchEvent(customEvent);
      } else if (event.data.type === "BPM_MULTIPLIER_CHANGE") {
        const customEvent = new CustomEvent("bpmMultiplierChange", {
          detail: {multiplier: event.data.multiplier},
        });
        window.dispatchEvent(customEvent);
      } else if (event.data.type === "TEXT_SHOW") {
        const customEvent = new CustomEvent("textShow");
        window.dispatchEvent(customEvent);
      } else if (event.data.type === "TEXT_HIDE") {
        const customEvent = new CustomEvent("textHide");
        window.dispatchEvent(customEvent);
      } else if (event.data.type === "THANKYOU_SHOW") {
        const customEvent = new CustomEvent("thankYouShow");
        window.dispatchEvent(customEvent);
      } else if (event.data.type === "THANKYOU_HIDE") {
        const customEvent = new CustomEvent("thankYouHide");
        window.dispatchEvent(customEvent);
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

      // Dance関連の変数
      let danceActive = false;
      let bpm = 120;
      let circleRadius = 20;
      let bpmMultiplier = 0.1;
      let lastBeatTime = 0;
      let beatCircles: Array<{
        x: number;
        y: number;
        progress: number;
        radius: number;
        vx: number; // x方向の速度
        vy: number; // y方向の速度
        color: "red" | "yellow" | "blue"; // Thank you時用の色情報
      }> = [];

      // テキストアニメーション関連の変数
      let textVisible = false;
      let textAnimating = false;
      let textAnimationProgress = 0;
      let textAnimationDirection: "show" | "hide" = "show";
      const SMALL_TEXT_DURATION = 1000; // 1秒
      const MAIN_TEXT_DURATION = 4000; // 4秒
      const TOTAL_ANIMATION_DURATION = SMALL_TEXT_DURATION + MAIN_TEXT_DURATION; // 合計5秒
      let animationStartTime = 0;

      // Thank you関連の変数
      let thankYouVisible = false;
      let thankYouAnimating = false;
      let thankYouAnimationDirection: "show" | "hide" = "show";
      let thankYouAnimationStartTime = 0;
      const THANKYOU_ANIMATION_DURATION = 5000; // 5秒

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

        window.addEventListener("danceToggle", ((event: CustomEvent) => {
          danceActive = event.detail.active;
          if (danceActive) {
            // すぐにビートを発火させるため、lastBeatTimeを大きな負の値に設定
            lastBeatTime = -10000;
          }
        }) as EventListener);

        window.addEventListener("bpmChange", ((event: CustomEvent) => {
          bpm = event.detail.bpm;
        }) as EventListener);

        window.addEventListener("circleRadiusChange", ((event: CustomEvent) => {
          circleRadius = event.detail.radius;
        }) as EventListener);

        window.addEventListener("bpmMultiplierChange", ((
          event: CustomEvent
        ) => {
          bpmMultiplier = event.detail.multiplier;
        }) as EventListener);

        window.addEventListener("textShow", (() => {
          textAnimating = true;
          textAnimationDirection = "show";
          animationStartTime = p.millis();
        }) as EventListener);

        window.addEventListener("textHide", (() => {
          textAnimating = true;
          textAnimationDirection = "hide";
          animationStartTime = p.millis();
        }) as EventListener);

        window.addEventListener("thankYouShow", (() => {
          thankYouAnimating = true;
          thankYouAnimationDirection = "show";
          thankYouAnimationStartTime = p.millis();
        }) as EventListener);

        window.addEventListener("thankYouHide", (() => {
          thankYouAnimating = true;
          thankYouAnimationDirection = "hide";
          thankYouAnimationStartTime = p.millis();
        }) as EventListener);
      };

      // キーボード操作は無効化（コントロールパネルからのみ操作）

      p.draw = () => {
        if (isAnimating) {
          // 2秒でアニメーション完了（60fps想定: 0.05 * 20 = 1.0 → 0.00833 * 120 = 1.0）
          transitionProgress += 1 / 120; // 約2秒（60fps × 2秒 = 120フレーム）
          if (transitionProgress >= 1.0) {
            transitionProgress = 1.0;
            activeLight = targetLight;
            isAnimating = false;
            // アニメーション終了後はloopを停止しない（アクティブなアニメーションを継続）
          }
        }

        // テキストアニメーション処理
        if (textAnimating) {
          const elapsed = p.millis() - animationStartTime;
          textAnimationProgress = p.constrain(
            elapsed / TOTAL_ANIMATION_DURATION,
            0,
            1
          );

          if (textAnimationProgress >= 1.0) {
            textAnimating = false;
            textAnimationProgress = 1.0;
            if (textAnimationDirection === "show") {
              textVisible = true;
            } else {
              textVisible = false;
            }
          }
        }

        // Thank youアニメーション処理
        if (thankYouAnimating) {
          const elapsed = p.millis() - thankYouAnimationStartTime;
          const thankYouProgress = p.constrain(
            elapsed / THANKYOU_ANIMATION_DURATION,
            0,
            1
          );

          if (thankYouProgress >= 1.0) {
            thankYouAnimating = false;
            if (thankYouAnimationDirection === "show") {
              thankYouVisible = true;
            } else {
              thankYouVisible = false;
            }
          }
        }

        // Dance機能: BPMに同期して円を生成（Thank you時は3色の円）
        if (
          danceActive &&
          (activeLight !== "none" || thankYouVisible || thankYouAnimating)
        ) {
          const beatInterval = (60 / bpm) * 1000; // ミリ秒
          const currentTime = p.millis();

          if (currentTime - lastBeatTime >= beatInterval) {
            lastBeatTime = currentTime;

            // BPMに比例した円の個数を生成
            const numCircles = Math.floor(bpm * bpmMultiplier);

            for (let i = 0; i < numCircles; i++) {
              // ランダムな速度を設定
              const angle = p.random(p.TWO_PI);
              const speed = p.random(1, 3);

              // Thank you時はランダムに色を選択、それ以外は現在の色
              let circleColor: "red" | "yellow" | "blue";
              if (thankYouVisible || thankYouAnimating) {
                const colors: Array<"red" | "yellow" | "blue"> = [
                  "red",
                  "yellow",
                  "blue",
                ];
                circleColor = colors[Math.floor(p.random(3))];
              } else {
                circleColor = activeLight as "red" | "yellow" | "blue";
              }

              beatCircles.push({
                x: p.random(p.width),
                y: p.random(p.height),
                progress: 0,
                radius: circleRadius,
                vx: p.cos(angle) * speed,
                vy: p.sin(angle) * speed,
                color: circleColor,
              });
            }
          }
        }

        // 円のアニメーション進行、位置更新、古い円の削除
        beatCircles = beatCircles.filter((circle) => {
          circle.progress += 0.05; // アニメーション速度
          // 位置を更新（動く）
          circle.x += circle.vx;
          circle.y += circle.vy;
          return circle.progress < 1.0;
        });

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
              brightness = p.lerp(0.0, 0.0, eased); // 常に0だがアニメーション対応
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
              brightness = p.lerp(0.0, 0.0, eased); // 常に0だがアニメーション対応
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

          const isActive = brightness > 0.0; // 少しでも明るければアクティブ

          drawPattern(
            p,
            centerX,
            centerY,
            width,
            light.color,
            brightness,
            circleRadius,
            isActive,
            isAllInactive,
            wasAllInactive,
            eased
          );

          // アクティブな円にテキストを表示（アニメーション対応）
          // テキストは50%以上の明るさで表示
          if (brightness > 0.5 && (textVisible || textAnimating)) {
            let colorLabel: string;
            let mainText: string;

            if (light.color === "blue") {
              colorLabel = "BLUE:";
              mainText = "HTK";
            } else if (light.color === "yellow") {
              colorLabel = "YELLOW:";
              mainText = "Carrot";
            } else {
              colorLabel = "RED:";
              mainText = "Wagyu\n&\nJOJI";
            }

            // アニメーション中のテキスト生成（順次実行）
            let displayColorLabel = colorLabel;
            let displayMainText = mainText;

            if (textAnimating) {
              const elapsed = p.millis() - animationStartTime;

              if (textAnimationDirection === "show") {
                // SHOW: small → main の順
                if (elapsed < SMALL_TEXT_DURATION) {
                  // smallテキストアニメーション中
                  const smallProgress = elapsed / SMALL_TEXT_DURATION;
                  displayColorLabel = getAnimatedText(
                    colorLabel,
                    smallProgress
                  );
                  displayMainText = ""; // メインはまだ表示しない
                } else {
                  // smallテキスト完了、mainテキストアニメーション中
                  displayColorLabel = colorLabel; // small完了
                  const mainProgress =
                    (elapsed - SMALL_TEXT_DURATION) / MAIN_TEXT_DURATION;
                  displayMainText = getAnimatedText(mainText, mainProgress);
                }
              } else {
                // HIDE: main → small の逆順
                const totalElapsed = elapsed;
                if (totalElapsed < MAIN_TEXT_DURATION) {
                  // mainテキスト消去中
                  displayColorLabel = colorLabel; // smallはまだ表示
                  const mainProgress = 1 - totalElapsed / MAIN_TEXT_DURATION;
                  displayMainText = getAnimatedText(mainText, mainProgress);
                } else {
                  // main消去完了、smallテキスト消去中
                  displayMainText = ""; // main消去完了
                  const smallProgress =
                    1 -
                    (totalElapsed - MAIN_TEXT_DURATION) / SMALL_TEXT_DURATION;
                  displayColorLabel = getAnimatedText(
                    colorLabel,
                    smallProgress
                  );
                }
              }
            }

            // テキストスタイル設定
            p.fill(255); // 白色
            p.textAlign(p.CENTER);
            p.textFont("Dela Gothic One");

            const lineHeight = 60;
            const startY = centerY - lineHeight / 2;

            // 1行目: 色ラベル（小さいサイズ）
            p.push();
            p.translate(centerX, startY - 150);
            p.textSize(24);
            p.text(displayColorLabel, 0, 0);
            p.pop();

            // 2行目: メインテキスト（大きいサイズ）
            p.push();
            p.translate(centerX, startY - lineHeight / 2);
            p.textSize(100);
            p.textLeading(110);
            p.text(displayMainText, 0, lineHeight);
            p.pop();
          }

          currentX += width;
        }

        // Thank you テキストを画面中央に表示（none時のみ）
        if ((thankYouVisible || thankYouAnimating) && activeLight === "none") {
          const thankYouText = "Thank you for Coming!";

          // フェードイン・フェードアウトのアルファ値を計算
          let alpha = 255;
          if (thankYouAnimating) {
            const elapsed = p.millis() - thankYouAnimationStartTime;
            const progress = p.constrain(
              elapsed / THANKYOU_ANIMATION_DURATION,
              0,
              1
            );
            const easedProgress = easeInOutCubic(progress);

            if (thankYouAnimationDirection === "show") {
              alpha = 255 * easedProgress;
            } else {
              alpha = 255 * (1 - easedProgress);
            }
          }

          p.noStroke();
          p.fill(255, 255, 255, alpha);
          p.textAlign(p.CENTER, p.CENTER);
          p.textFont("Dela Gothic One");
          p.textSize(80);
          p.text(thankYouText, p.width / 2, p.height / 2);
        }

        // Dance円を描画
        if (beatCircles.length > 0) {
          for (const circle of beatCircles) {
            // 円ごとの色を決定
            let baseColor: [number, number, number];
            if (circle.color === "blue") {
              baseColor = [0, 150, 255];
            } else if (circle.color === "yellow") {
              baseColor = [255, 220, 0];
            } else {
              baseColor = [255, 50, 50];
            }
            // 強いキック効果: 最初に一気に明るくなり、その後ゆっくりフェードアウト
            let fadeAlpha: number;
            if (circle.progress < 0.1) {
              // 最初の10%で一気に最大輝度へ
              fadeAlpha = p.map(circle.progress, 0, 0.1, 0, 255);
            } else {
              // 残りの90%でゆっくりフェードアウト
              const fadeProgress = (circle.progress - 0.1) / 0.9;
              const easedFade = easeInOutCubic(fadeProgress);
              fadeAlpha = p.map(easedFade, 0, 1, 255, 0);
            }

            // サイズも少し変化させてキック感を強調
            const sizeMultiplier =
              circle.progress < 0.1
                ? p.map(circle.progress, 0, 0.1, 1.2, 1.0)
                : 1.0;

            p.noStroke();
            p.fill(baseColor[0], baseColor[1], baseColor[2], fadeAlpha);
            p.ellipse(
              circle.x,
              circle.y,
              circle.radius * 2 * sizeMultiplier,
              circle.radius * 2 * sizeMultiplier
            );
          }
        }
      };

      function easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }

      // ASCIIアニメーション用の関数
      function getAnimatedText(targetText: string, progress: number): string {
        const chars =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
        const totalChars = targetText.length;
        const charsToShow = Math.floor(totalChars * progress);

        let result = "";
        for (let i = 0; i < totalChars; i++) {
          if (targetText[i] === "\n") {
            // 改行はそのまま保持
            result += "\n";
          } else if (i < charsToShow) {
            // 確定した文字
            result += targetText[i];
          } else if (i === charsToShow) {
            // 現在アニメーション中の文字（ランダム）
            const randomChar = chars[Math.floor(p.random(chars.length))];
            result += randomChar;
          } else {
            // まだ表示されていない文字は空白
            result += " ";
          }
        }
        return result;
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
        isAllInactive: boolean,
        wasAllInactive: boolean,
        transitionEased: number
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
        // アニメーション中は滑らかに補間
        let patternSize: number;
        let scaleX: number;
        let scaleY: number;

        if (isAllInactive && wasAllInactive) {
          // 全てinactive状態が継続
          patternSize = allocatedWidth;
          scaleX = 1;
          scaleY = 1;
        } else if (!wasAllInactive && isAllInactive) {
          // アクティブ → 全てinactive（縦100% → 横幅基準に遷移）
          patternSize = p.lerp(p.height, allocatedWidth, transitionEased);
          scaleX = p.lerp(allocatedWidth / p.height, 1, transitionEased);
          scaleY = 1;
        } else if (wasAllInactive && !isAllInactive) {
          // 全てinactive → アクティブ（横幅基準 → 縦100%に遷移）
          patternSize = p.lerp(allocatedWidth, p.height, transitionEased);
          scaleX = p.lerp(1, allocatedWidth / p.height, transitionEased);
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

              // ノイズとsinを使ったアニメーション（明るさを大幅UP）
              const time = p.millis() / 1000;
              const noiseVal = p.noise(i / 10, j / 10, time);
              // アルファ値を大幅に増加（最大255に近づける）
              const alpha = 255 * brightness * p.map(noiseVal, 0, 1, 0.5, 1.0);

              const r = baseColor[0];
              const g = baseColor[1];
              const b = baseColor[2];
              pg.fill(r, g, b, alpha);

              // ランダムとsinを使ってちらつき効果
              if (p.random() < 0.5 * (p.sin(p.millis() / 500) + 1)) {
                const animatedSize = circleSize * (0.8 + 0.4 * noiseVal);
                pg.ellipse(x, y, animatedSize, animatedSize);
              }
            }
          }
        }

        // 白いアウトラインを描画（イージング対応）
        // brightnessが低い（非アクティブ）ほど不透明度が高くなる
        const outlineAlpha = 255 * (1 - brightness);

        if (outlineAlpha > 0) {
          pg.noFill();
          pg.stroke(255, 255, 255, outlineAlpha);
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
