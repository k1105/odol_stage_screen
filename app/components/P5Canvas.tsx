'use client';

import { useEffect, useRef } from 'react';
import p5 from 'p5';

export default function P5Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const sketch = (p: p5) => {
      let layersSlider: p5.Element;
      let radiusSlider: p5.Element;
      let spacingSlider: p5.Element;
      let prevValues: any = {};
      let activeLight: 'red' | 'yellow' | 'blue' = 'red';
      let targetLight: 'red' | 'yellow' | 'blue' = 'red';
      let transitionProgress: number = 1.0;
      let isAnimating: boolean = false;

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.fill(0, 200, 255);
        p.stroke(0);
        p.strokeWeight(1);

        p.createP('Layers');
        layersSlider = p.createSlider(3, 20, 6, 1);
        p.createP('Radius');
        radiusSlider = p.createSlider(5, 50, 20, 1);
        p.createP('Spacing Factor');
        spacingSlider = p.createSlider(1.0, 2.0, 1.4, 0.05);

        [layersSlider, radiusSlider, spacingSlider].forEach((sl: p5.Element) => {
          sl.input(() => {
            if (hasSliderChanged()) p.redraw();
          });
        });

        storeCurrentValues();
      };

      p.keyPressed = () => {
        let newLight: 'red' | 'yellow' | 'blue' | null = null;

        if (p.key === 'r' || p.key === 'R') {
          newLight = 'red';
        } else if (p.key === 'y' || p.key === 'Y') {
          newLight = 'yellow';
        } else if (p.key === 'b' || p.key === 'B') {
          newLight = 'blue';
        }

        if (newLight && newLight !== targetLight) {
          targetLight = newLight;
          transitionProgress = 0;
          isAnimating = true;
          p.loop();
        }
      };

      p.draw = () => {
        if (isAnimating) {
          transitionProgress += 0.05;
          if (transitionProgress >= 1.0) {
            transitionProgress = 1.0;
            activeLight = targetLight;
            isAnimating = false;
            p.noLoop();
          }
        }

        const eased = easeInOutCubic(transitionProgress);

        p.background(0);

        const centerY = p.height / 2;

        const lights: Array<{ color: 'blue' | 'yellow' | 'red'; index: number }> = [
          { color: 'blue', index: 0 },
          { color: 'yellow', index: 1 },
          { color: 'red', index: 2 }
        ];

        let currentX = 0;
        for (const light of lights) {
          const wasActive = activeLight === light.color;
          const willBeActive = targetLight === light.color;

          const activeCircleWidth = p.height;
          const remainingWidth = p.width - activeCircleWidth;
          const inactiveCircleWidth = remainingWidth / 2;

          let width: number;
          let brightness: number;

          if (wasActive && !willBeActive) {
            width = p.lerp(activeCircleWidth, inactiveCircleWidth, eased);
            brightness = p.lerp(1.0, 0.0, eased);
          } else if (!wasActive && willBeActive) {
            width = p.lerp(inactiveCircleWidth, activeCircleWidth, eased);
            brightness = p.lerp(0.0, 1.0, eased);
          } else if (wasActive && willBeActive) {
            width = activeCircleWidth;
            brightness = 1.0;
          } else {
            width = inactiveCircleWidth;
            brightness = 0.0;
          }

          const centerX = currentX + width / 2;

          drawPattern(p, centerX, centerY, width, light.color, brightness);

          currentX += width;
        }

        storeCurrentValues();
      };

      function easeInOutCubic(t: number): number {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }

      function drawPattern(
        pg: p5,
        centerX: number,
        centerY: number,
        allocatedWidth: number,
        color: 'blue' | 'yellow' | 'red',
        brightness: number
      ) {
        const layers = (layersSlider as any).value();
        const radius = (radiusSlider as any).value();
        const spacingFactor = (spacingSlider as any).value();

        pg.noStroke();

        let baseColor: [number, number, number];
        if (color === 'blue') {
          baseColor = [0, 150, 255];
        } else if (color === 'yellow') {
          baseColor = [255, 220, 0];
        } else {
          baseColor = [255, 50, 50];
        }

        const darkColor: [number, number, number] = [30, 30, 30];
        const r = p.lerp(darkColor[0], baseColor[0], brightness);
        const g = p.lerp(darkColor[1], baseColor[1], brightness);
        const b = p.lerp(darkColor[2], baseColor[2], brightness);
        pg.fill(r, g, b);

        const patternSize = p.height;
        const scaleX = allocatedWidth / p.height;
        const scaleY = 1;

        for (let i = 0; i < layers; i++) {
          const circleRadius = p.map(i, 0, layers - 1, 0, patternSize / 2.2);
          const circleSize = radius;
          const circumference = p.TWO_PI * circleRadius;
          const circlesPerLayer = p.max(6, p.floor(circumference / (circleSize * spacingFactor)));

          for (let j = 0; j < circlesPerLayer; j++) {
            const angle = p.TWO_PI * j / circlesPerLayer + (i % 2) * p.PI / circlesPerLayer;
            const x = centerX + p.cos(angle) * circleRadius * scaleX;
            const y = centerY + p.sin(angle) * circleRadius * scaleY;

            pg.ellipse(x, y, circleSize, circleSize);
          }
        }
      }

      function hasSliderChanged() {
        return (
          (layersSlider as any).value() !== prevValues.layers ||
          (radiusSlider as any).value() !== prevValues.radius ||
          (spacingSlider as any).value() !== prevValues.spacing
        );
      }

      function storeCurrentValues() {
        prevValues = {
          layers: (layersSlider as any).value(),
          radius: (radiusSlider as any).value(),
          spacing: (spacingSlider as any).value()
        };
      }

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        p.redraw();
      };
    };

    p5InstanceRef.current = new p5(sketch, canvasRef.current);

    return () => {
      p5InstanceRef.current?.remove();
    };
  }, []);

  return <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}
