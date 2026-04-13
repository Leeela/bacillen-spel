import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// ─── Timeline (30 fps, 900 frames = 30 s) ────────────────────────────────────
const T = {
  sneakStart: 30,   // 1 s  – character enters from left
  sneakEnd: 390,    // 13 s – character reaches bowl
  eatStart: 340,    // 11.3 s – starts eating
  cheeksStart: 400, // 13.3 s – cheeks begin puffing
  eatEnd: 540,      // 18 s – done eating
  rushStart: 510,   // 17 s – sugar rush bouncing
  rushEnd: 680,     // 22.7 s
  sleepStart: 650,  // 21.7 s – sugar crash begins
  asleep: 820,      // 27.3 s – fully tipped over
  zzzStart: 730,    // 24.3 s
};

// ─── Kitchen Background ───────────────────────────────────────────────────────
const Kitchen: React.FC<{ frame: number }> = ({ frame }) => {
  const introOpacity = interpolate(frame, [0, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const moonPulse = 0.82 + Math.sin(frame * 0.025) * 0.08;

  return (
    <svg
      width="1080"
      height="1920"
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", top: 0, left: 0, opacity: introOpacity }}
    >
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="28%" r="55%">
          <stop offset="0%" stopColor="#ece6b8" stopOpacity={moonPulse} />
          <stop offset="45%" stopColor="#b8b090" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#060d1a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="counterGlow" cx="77%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c8d8f0" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#060d1a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Night sky */}
      <rect width="1080" height="1920" fill="#06101e" />

      {/* Kitchen wall */}
      <rect width="1080" height="1480" fill="#0d1a2c" />

      {/* Stars in corners */}
      {[
        [60, 90], [140, 55], [210, 130], [40, 185], [290, 72],
        [370, 110], [28, 260], [430, 58], [500, 140],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={1 + (i % 2) * 0.8}
          fill="white"
          opacity={0.45 + (i % 3) * 0.18}
        />
      ))}

      {/* Window frame outer */}
      <rect x="630" y="70" width="400" height="470" rx="22" fill="#0a1628" />
      {/* Window glass */}
      <rect x="644" y="84" width="372" height="442" rx="16" fill="#050d1c" />
      {/* Moon glow fills the window */}
      <rect
        x="644"
        y="84"
        width="372"
        height="442"
        rx="16"
        fill="url(#moonGlow)"
      />
      {/* Moon */}
      <circle cx="840" cy="240" r="88" fill="#f0e9b8" opacity={moonPulse} />
      {/* Crescent shadow */}
      <circle cx="872" cy="215" r="88" fill="#050d1c" />
      {/* Re-draw moon portion visible after crescent cut */}
      <circle cx="840" cy="240" r="88" fill="#f0e9b8" opacity={moonPulse} clipPath="none" />
      <circle cx="872" cy="215" r="88" fill="#050d1c" />
      {/* Moon glow halo */}
      <circle cx="840" cy="240" r="110" fill="rgba(240,230,170,0.08)" />

      {/* Window cross-bars */}
      <rect x="644" y="298" width="372" height="7" rx="3.5" fill="#121e35" />
      <rect x="828" y="84" width="7" height="442" rx="3.5" fill="#121e35" />

      {/* Moonlight beam through window */}
      <polygon
        points="644,300 1016,300 1080,580 1080,920 644,920"
        fill="rgba(200,220,255,0.025)"
      />

      {/* Left wall cabinets */}
      <rect
        x="-8"
        y="740"
        width="440"
        height="680"
        rx="10"
        fill="#100d07"
        stroke="#1a1508"
        strokeWidth="3"
      />
      <rect
        x="18"
        y="774"
        width="188"
        height="296"
        rx="8"
        fill="#0a0904"
        stroke="#1a1508"
        strokeWidth="2"
      />
      <rect
        x="224"
        y="774"
        width="188"
        height="296"
        rx="8"
        fill="#0a0904"
        stroke="#1a1508"
        strokeWidth="2"
      />
      {/* Cabinet handles */}
      <rect x="102" y="916" width="32" height="9" rx="4.5" fill="#22180a" />
      <rect x="308" y="916" width="32" height="9" rx="4.5" fill="#22180a" />

      {/* Right cabinet */}
      <rect
        x="640"
        y="620"
        width="450"
        height="760"
        rx="10"
        fill="#100d07"
        stroke="#1a1508"
        strokeWidth="3"
      />
      <rect
        x="666"
        y="654"
        width="188"
        height="296"
        rx="8"
        fill="#0a0904"
        stroke="#1a1508"
        strokeWidth="2"
      />
      <rect
        x="872"
        y="654"
        width="188"
        height="296"
        rx="8"
        fill="#0a0904"
        stroke="#1a1508"
        strokeWidth="2"
      />
      <rect x="750" y="796" width="32" height="9" rx="4.5" fill="#22180a" />
      <rect x="956" y="796" width="32" height="9" rx="4.5" fill="#22180a" />

      {/* Counter top */}
      <rect x="-10" y="1370" width="1100" height="96" fill="#271a0c" />
      {/* Counter highlight edge */}
      <rect x="-10" y="1368" width="1100" height="16" fill="#352210" />
      {/* Counter shadow edge */}
      <rect x="-10" y="1462" width="1100" height="10" fill="#120b04" />

      {/* Floor */}
      <rect x="-10" y="1472" width="1100" height="460" fill="#090604" />

      {/* Moonlight pool on counter */}
      <ellipse
        cx="840"
        cy="1418"
        rx="175"
        ry="22"
        fill="url(#counterGlow)"
      />
    </svg>
  );
};

// ─── Candy Bowl ──────────────────────────────────────────────────────────────
const CandyBowl: React.FC<{ eatFrame: number }> = ({ eatFrame }) => {
  const bx = 760;
  const by = 1348;

  const candyList = [
    { cx: bx - 58, cy: by - 10, r: 23, fill: "#ff6b6b", stroke: "#cc3030" },
    { cx: bx - 16, cy: by - 17, r: 21, fill: "#ffd93d", stroke: "#cca800" },
    { cx: bx + 26, cy: by - 12, r: 25, fill: "#6bcb77", stroke: "#3d9946" },
    { cx: bx + 68, cy: by - 6, r: 21, fill: "#4d96ff", stroke: "#2040cc" },
    { cx: bx + 6, cy: by - 3, r: 17, fill: "#ff922b", stroke: "#cc6000" },
  ];

  // Candy disappears one-by-one as eating progresses
  const candyEaten = Math.min(
    Math.floor(eatFrame / 36),
    candyList.length,
  );

  // Flying candy particles when eating starts
  const showFly = eatFrame > 0 && eatFrame < 100;

  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      width="1080"
      height="1920"
    >
      {/* Bowl shadow */}
      <ellipse
        cx={bx}
        cy={by + 78}
        rx="100"
        ry="11"
        fill="rgba(0,0,0,0.35)"
      />

      {/* Bowl body */}
      <path
        d={`M ${bx - 112},${by} Q ${bx - 107},${by + 82} ${bx},${by + 94} Q ${bx + 107},${by + 82} ${bx + 112},${by}`}
        fill="#e8e8e8"
        stroke="#cecece"
        strokeWidth="4"
      />
      {/* Bowl rim */}
      <ellipse
        cx={bx}
        cy={by}
        rx="112"
        ry="30"
        fill="#f6f6f6"
        stroke="#cecece"
        strokeWidth="4"
      />

      {/* Remaining candies */}
      {candyList.slice(candyEaten).map((c, i) => (
        <g key={i}>
          <circle
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill={c.fill}
            stroke={c.stroke}
            strokeWidth="2.5"
          />
          {/* Candy shine */}
          <ellipse
            cx={c.cx - c.r * 0.28}
            cy={c.cy - c.r * 0.32}
            rx={c.r * 0.28}
            ry={c.r * 0.2}
            fill="rgba(255,255,255,0.42)"
            transform={`rotate(-28 ${c.cx} ${c.cy})`}
          />
        </g>
      ))}

      {/* Candy flying into mouth */}
      {showFly &&
        candyList.slice(0, 2).map((c, i) => {
          const flyProgress = interpolate(eatFrame, [0, 80], [0, 1], {
            extrapolateRight: "clamp",
          });
          const targetX = bx - 220 + i * 60; // toward character mouth
          const targetY = by - 120;
          const cx = c.cx + (targetX - c.cx) * flyProgress;
          const cy = c.cy + (targetY - c.cy) * flyProgress - Math.sin(flyProgress * Math.PI) * 40;
          const opacity = interpolate(eatFrame, [60, 100], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <circle
              key={`fly${i}`}
              cx={cx}
              cy={cy}
              r={c.r * 0.8}
              fill={c.fill}
              opacity={opacity}
            />
          );
        })}
    </svg>
  );
};

// ─── ZZZ Bubbles ─────────────────────────────────────────────────────────────
const SleepZZZ: React.FC<{ frame: number; cx: number; cy: number }> = ({
  frame,
  cx,
  cy,
}) => {
  const bubbles = [
    { delay: 0, dx: 60, size: 32 },
    { delay: 28, dx: 90, size: 42 },
    { delay: 58, dx: 115, size: 54 },
  ];

  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      width="1080"
      height="1920"
    >
      {bubbles.map(({ delay, dx, size }, i) => {
        const lf = frame - delay;
        if (lf < 0) return null;
        const cycle = lf % 80;
        const opacity = interpolate(cycle, [0, 12, 60, 80], [0, 1, 0.85, 0]);
        const rise = interpolate(cycle, [0, 80], [0, -90]);
        const wobble = Math.sin(cycle * 0.12) * 8;
        return (
          <text
            key={i}
            x={cx + dx + wobble}
            y={cy + rise}
            fontSize={size}
            fontFamily="Georgia, 'Times New Roman', serif"
            fontWeight="bold"
            fill="#92b8e8"
            opacity={opacity}
            textAnchor="middle"
          >
            Z
          </text>
        );
      })}
    </svg>
  );
};

// ─── Sugar Rush Sparkles ──────────────────────────────────────────────────────
const Sparkles: React.FC<{
  frame: number;
  cx: number;
  cy: number;
  visible: boolean;
}> = ({ frame, cx, cy, visible }) => {
  if (!visible) return null;

  const positions = [
    { dx: -180, dy: -60, delay: 0 },
    { dx: 320, dy: -30, delay: 8 },
    { dx: 140, dy: -120, delay: 16 },
    { dx: -100, dy: 80, delay: 6 },
    { dx: 260, dy: 100, delay: 22 },
    { dx: 200, dy: -160, delay: 12 },
  ];

  const colors = ["#ffd700", "#ff9f43", "#ffeaa7", "#ff6b9d", "#a29bfe"];

  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      width="1080"
      height="1920"
    >
      {positions.map(({ dx, dy, delay }, i) => {
        const lf = (frame + delay * 4) % 50;
        const scale = interpolate(lf, [0, 12, 28, 50], [0, 1.3, 0.9, 0]);
        const color = colors[i % colors.length];
        const x = cx + dx;
        const y = cy + dy;
        return (
          <g key={i} transform={`translate(${x},${y}) scale(${scale})`}>
            <polygon
              points="0,-14 3.5,-3.5 14,0 3.5,3.5 0,14 -3.5,3.5 -14,0 -3.5,-3.5"
              fill={color}
              opacity={0.92}
            />
          </g>
        );
      })}
    </svg>
  );
};

// ─── Candy Stripe Label ───────────────────────────────────────────────────────
const SceneLabel: React.FC<{ frame: number }> = ({ frame }) => {
  // Brief "night kitchen" label that fades out
  const opacity = interpolate(frame, [10, 40, 70, 100], [0, 0.7, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (opacity <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 120,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity,
        fontFamily: "Georgia, serif",
        fontSize: 38,
        color: "#c8d8f0",
        letterSpacing: 4,
        textShadow: "0 2px 12px rgba(0,0,0,0.8)",
      }}
    >
      nattköket...
    </div>
  );
};

// ─── Main Composition ─────────────────────────────────────────────────────────
export const GodisbacillenAnimation: React.FC = () => {
  const frame = useCurrentFrame();

  // ── Character X: slide from off-screen-left to beside the bowl ──
  const charX = interpolate(frame, [T.sneakStart, T.sneakEnd], [-490, 280], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ── Tiptoe bounce while sneaking ──
  const isSneaking = frame >= T.sneakStart && frame < T.sneakEnd;
  const tiptoe = isSneaking ? -Math.abs(Math.sin(frame * 0.32)) * 16 : 0;

  // ── Head-bob while eating ──
  const isEating = frame >= T.eatStart && frame <= T.eatEnd;
  const eatBob = isEating
    ? Math.sin((frame - T.eatStart) * 0.38) * 26
    : 0;

  // ── Sugar rush jitter ──
  const isRushing = frame >= T.rushStart && frame <= T.rushEnd;
  const rushY = isRushing ? Math.sin(frame * 0.85) * 18 : 0;
  const rushX = isRushing ? Math.sin(frame * 0.6 + 1) * 8 : 0;

  // ── Cheek puff (0 → 1) ──
  const cheekPuff = interpolate(
    frame,
    [T.cheeksStart, T.eatEnd - 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Sleep tilt: gentle wobble then fall ──
  const sleepTilt = interpolate(
    frame,
    [T.sleepStart, T.sleepStart + 40, T.sleepStart + 80, T.asleep],
    [0, -14, 10, 92],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  // ── Slow-down during crash ──
  const sleepSink = interpolate(frame, [T.sleepStart + 40, T.asleep], [0, 55], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Final character position ──
  const charW = 490;
  const charH = 490;
  // Feet are ~68% down the SVG image; counter top is at y=1370
  const charTopY = 1370 - charH * 0.685;
  const charLeft = charX + rushX;
  const charTop = charTopY + tiptoe + eatBob + rushY + sleepSink;

  // Where to float ZZZ from (character's head area)
  const zzzCX = charLeft + charW * 0.72;
  const zzzCY = charTop + charH * 0.22;

  // Center of character for sparkles
  const sparkCX = charLeft + charW * 0.5;
  const sparkCY = charTop + charH * 0.4;

  return (
    <AbsoluteFill style={{ background: "#06101e", overflow: "hidden" }}>
      {/* ── Background ── */}
      <Kitchen frame={frame} />

      {/* ── Candy bowl (drawn behind character) ── */}
      <CandyBowl eatFrame={Math.max(0, frame - T.eatStart)} />

      {/* ── Character ── */}
      <div
        style={{
          position: "absolute",
          left: charLeft,
          top: charTop,
          width: charW,
          height: charH,
          transformOrigin: "50% 68%",
          transform: `rotate(${sleepTilt}deg)`,
        }}
      >
        <Img
          src={staticFile("godisbacillen.svg")}
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        {/* ── Puffed cheeks overlay ── */}
        {cheekPuff > 0 && (
          <>
            {/* Left cheek */}
            <div
              style={{
                position: "absolute",
                left: 52,
                top: 168,
                width: 100,
                height: 84,
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(255,140,140,0.72) 0%, rgba(255,100,100,0.35) 60%, transparent 100%)",
                transform: `scale(${cheekPuff})`,
                transformOrigin: "center center",
              }}
            />
            {/* Right cheek */}
            <div
              style={{
                position: "absolute",
                right: 42,
                top: 168,
                width: 100,
                height: 84,
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(255,140,140,0.72) 0%, rgba(255,100,100,0.35) 60%, transparent 100%)",
                transform: `scale(${cheekPuff})`,
                transformOrigin: "center center",
              }}
            />
          </>
        )}
      </div>

      {/* ── Sparkles during sugar rush ── */}
      <Sparkles
        frame={frame}
        cx={sparkCX}
        cy={sparkCY}
        visible={isRushing}
      />

      {/* ── ZZZ when asleep ── */}
      {frame >= T.zzzStart && (
        <SleepZZZ
          frame={frame - T.zzzStart}
          cx={zzzCX}
          cy={zzzCY}
        />
      )}

      {/* ── Opening label ── */}
      <SceneLabel frame={frame} />
    </AbsoluteFill>
  );
};
