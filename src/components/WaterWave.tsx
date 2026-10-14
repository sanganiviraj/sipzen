import React, { useEffect, useRef } from "react";

interface WaterWaveProps {
  percentage: number;
  currentMl: number;
  goalMl: number;
  isCompleted: boolean;
}

export const WaterWave: React.FC<WaterWaveProps> = ({
  percentage,
  currentMl,
  goalMl,
  isCompleted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;

    // Target fill height based on percentage (clamped between 5% and 95% for aesthetics)
    const targetRatio = Math.min(Math.max(percentage / 100, 0), 1);
    let currentRatio = targetRatio;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      // Smooth interpolation
      currentRatio += (targetRatio - currentRatio) * 0.05;

      const fillLevel = height - height * currentRatio;

      step += 0.035;

      // Background wave (darker cyan/blue)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x++) {
        const y =
          fillLevel +
          Math.sin(x * 0.03 + step * 1.2) * 6 +
          Math.cos(x * 0.015 - step * 0.8) * 3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      const gradBack = ctx.createLinearGradient(0, fillLevel, 0, height);
      gradBack.addColorStop(0, "rgba(56, 189, 248, 0.45)");
      gradBack.addColorStop(1, "rgba(14, 165, 233, 0.75)");
      ctx.fillStyle = gradBack;
      ctx.fill();
      ctx.restore();

      // Foreground wave (brighter crystal water blue)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x++) {
        const y =
          fillLevel +
          Math.sin(x * 0.025 - step) * 7 +
          Math.sin(x * 0.01 + step * 0.5) * 4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      const gradFront = ctx.createLinearGradient(0, fillLevel, 0, height);
      gradFront.addColorStop(0, "rgba(14, 165, 233, 0.85)");
      gradFront.addColorStop(0.5, "rgba(2, 132, 199, 0.95)");
      gradFront.addColorStop(1, "rgba(3, 105, 161, 1.0)");
      ctx.fillStyle = gradFront;
      ctx.fill();
      ctx.restore();

      // Occasional rising water bubble
      const bubbleTime = step * 15;
      const bx = (width / 2) + Math.sin(bubbleTime * 0.05) * 35;
      const by = fillLevel + 25 + ((bubbleTime * 1.5) % Math.max(height - fillLevel - 10, 10));
      if (by < height) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, height - (by - fillLevel), 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [percentage]);

  return (
    <div className="water-gauge-container">
      <div className={`water-gauge-circle ${isCompleted ? "completed-glow" : ""}`}>
        <canvas
          ref={canvasRef}
          width={180}
          height={180}
          className="water-canvas"
        />

        {/* Gloss overlay */}
        <div className="glass-reflection" />

        {/* Center content */}
        <div className="water-metrics">
          <div className="water-percentage">{Math.round(percentage)}%</div>
          <div className="water-amount">
            <span className="current-ml">{currentMl}</span>
            <span className="unit-ml"> / {goalMl} ml</span>
          </div>
          {isCompleted && (
            <div className="goal-badge">🎉 Daily Goal Met!</div>
          )}
        </div>
      </div>
    </div>
  );
};
