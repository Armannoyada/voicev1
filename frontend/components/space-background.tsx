"use client";

import { useEffect, useMemo, useState } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  hue: number;
}

interface ShootingStar {
  top: number;
  delay: number;
  duration: number;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function SpaceBackground({
  starCount = 160,
  showPlanets = true,
  showGrid = false,
}: {
  starCount?: number;
  showPlanets?: boolean;
  showGrid?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const stars: Star[] = useMemo(() => {
    const rand = mulberry32(42);
    return Array.from({ length: starCount }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      size: rand() * 1.8 + 0.4,
      delay: rand() * 5,
      duration: 2.5 + rand() * 4,
      hue: rand() > 0.85 ? 186 : rand() > 0.6 ? 270 : 0,
    }));
  }, [starCount]);

  const shooters: ShootingStar[] = useMemo(() => {
    const rand = mulberry32(7);
    return Array.from({ length: 3 }, () => ({
      top: rand() * 70,
      delay: rand() * 8,
      duration: 1.8 + rand() * 1.4,
    }));
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <div className="absolute -top-40 -left-40 h-[55rem] w-[55rem] rounded-full bg-[hsl(270_80%_45%/0.18)] blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-[45rem] w-[45rem] rounded-full bg-[hsl(186_100%_50%/0.14)] blur-3xl" />
      <div className="absolute -bottom-40 left-1/4 h-[40rem] w-[40rem] rounded-full bg-[hsl(330_100%_60%/0.10)] blur-3xl" />

      {showGrid && <div className="absolute inset-0 grid-bg opacity-60" />}

      {mounted && (
        <>
          {stars.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full animate-twinkle"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                background:
                  s.hue === 0
                    ? "white"
                    : `hsl(${s.hue} 100% 70%)`,
                boxShadow:
                  s.size > 1.4
                    ? `0 0 ${s.size * 4}px ${
                        s.hue === 0
                          ? "rgba(255,255,255,0.7)"
                          : `hsl(${s.hue} 100% 70% / 0.7)`
                      }`
                    : undefined,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
              }}
            />
          ))}

          {shooters.map((s, i) => (
            <span
              key={`sh-${i}`}
              className="absolute h-px w-32 bg-gradient-to-r from-transparent via-white to-transparent"
              style={{
                top: `${s.top}%`,
                left: 0,
                opacity: 0,
                animation: `scan ${s.duration}s ease-in ${s.delay}s infinite`,
              }}
            />
          ))}
        </>
      )}

      {showPlanets && (
        <>
          <div className="absolute right-[6%] top-[8%] h-40 w-40 animate-float">
            <div
              className="h-full w-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #ffd97d 0%, #f59e0b 35%, #b45309 65%, #4a1d05 100%)",
                boxShadow:
                  "0 0 80px 20px rgba(251,191,36,0.35), inset -8px -10px 30px rgba(0,0,0,0.5)",
              }}
            />
            <div className="absolute inset-[-25%] rounded-full border border-amber-300/20 animate-spin-slow" />
            <div className="absolute inset-[-45%] rounded-full border border-amber-300/10 animate-spin-reverse" />
          </div>

          <div className="absolute left-[6%] bottom-[12%] h-28 w-28 animate-float-slow">
            <div
              className="h-full w-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, #67e8f9 0%, #06b6d4 40%, #0e7490 70%, #042f3f 100%)",
                boxShadow:
                  "0 0 60px 12px rgba(34,211,238,0.35), inset -6px -8px 22px rgba(0,0,0,0.55)",
              }}
            />
          </div>

          <div className="absolute left-[35%] top-[18%] h-16 w-16 animate-float">
            <div
              className="h-full w-full rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 40% 35%, #f0abfc 0%, #a855f7 40%, #6b21a8 70%, #1e0529 100%)",
                boxShadow:
                  "0 0 40px 6px rgba(168,85,247,0.35), inset -4px -6px 16px rgba(0,0,0,0.55)",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
