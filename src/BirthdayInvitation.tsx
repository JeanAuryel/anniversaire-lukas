import { useState, useEffect, useCallback, useRef, ReactNode, MouseEvent } from "react";
import emailjs from "@emailjs/browser";

// ============================================================
//  EMAILJS — remplacez ces 3 valeurs après configuration
//  sur https://www.emailjs.com
// ============================================================
const EMAILJS = {
  serviceId:  "service_ptel1jx",   // ⚠️ Votre Service ID
  templateId: "template_2np0ly7",  // ⚠️ Votre Template ID
  publicKey:  "RZL3LdjT_W6UBe08L", // ⚠️ Votre Public Key
} as const;

// ============================================================
//  PERSONNALISATION — modifiez ces valeurs selon votre fête !
// ============================================================
const CONFIG = {
  childName: "Lukas",      // ⚠️ Remplacez par le prénom de votre fils !
  age: 5,
  date: "Mercredi 18 juin 2026",
  time: "13h30 – 16h30",        // Horaire à adapter
  locationName: "PlayJump Toulouse",
  locationAddress: "6 Rue Théron de Montaugé, 31200 Toulouse",
  locationMapsUrl:
    "https://www.google.com/maps/place/PlayJump+Toulouse/@43.6328199,1.4836287,15z",
  locationDescription:
    "Un parc de loisirs multi-activités indoor de 1 400 m², à l'est de Toulouse (terminus Balma-Gramont). Trampolines, Ninja Warrior, mur d'escalade, plaine de jeux et bien plus — toutes les activités accessibles pour une journée 100 % fun !",
  hostName: "Akinotcho",    // ⚠️ Remplacez par votre nom de famille
  hostPhone: "07 84 76 08 80",  // ⚠️ Votre numéro
  hostEmail: "familleakinotcho@gmail.com", // ⚠️ Votre email
  rsvpDeadline: "Dimanche 14 juin 2026",
} as const;

// ============================================================
//  Types
// ============================================================
interface Activity {
  icon: string;
  title: string;
  desc: string;
}

interface Charge {
  icon: string;
  label: string;
  detail: string;
}

interface ChildInfo {
  firstName: string;
  lastName: string;
  allergies: string;
  message: string;
}

interface ParentInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

type Answer = "yes" | "no";

// ============================================================
//  Données
// ============================================================
const ACTIVITIES: Activity[] = [
  {
    icon: "🤸",
    title: "Trampoline Park",
    desc: "Un immense parc de trampolines pour sauter, faire des figures et défier la gravité — mégas jumps garantis !",
  },
  {
    icon: "🥷",
    title: "Parcours Ninja Warrior",
    desc: "Barres, obstacles, passerelles… Teste ton agilité et ton endurance sur ce parcours digne des plus grands champions !",
  },
  {
    icon: "🧗",
    title: "Mur d'escalade & Bac à mousse",
    desc: "Grimpe jusqu'en haut du mur et plonge dans un bac à mousse géant pour un atterrissage tout en douceur !",
  },
  {
    icon: "🎊",
    title: "Surprises & goûter",
    desc: "Des surprises spécialement préparées pour l'occasion, et un goûter d'anniversaire pour fêter les 5 ans de Lukas !",
  },
];

const CHARGES: Charge[] = [
  { icon: "🎟️", label: "Entrée au parc",  detail: "Accès à toutes les activités PlayJump offert pour chaque enfant invité" },
  { icon: "🚌", label: "Transport",        detail: "Covoiturage organisé depuis le point de rendez-vous" },
  { icon: "🍽️", label: "Repas & goûter",  detail: "Repas du midi et goûter d'anniversaire inclus" },
];

const CONFETTI_COLORS = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF9F45", "#C77DFF"];
const STEPS_LABELS    = ["Participation", "L'enfant", "Accompagnateur", "Vos infos"];

// ============================================================
//  Styles globaux injectés une seule fois
// ============================================================
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Nunito', sans-serif;
    background: #FFF6ED;
    color: #3D2B1F;
    overflow-x: hidden;
  }

  @keyframes floatUp {
    0%   { transform: translateY(0) rotate(-3deg); }
    50%  { transform: translateY(-18px) rotate(3deg); }
    100% { transform: translateY(0) rotate(-3deg); }
  }
  @keyframes bounceIn {
    0%   { opacity: 0; transform: scale(0.6); }
    70%  { transform: scale(1.08); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes confettiFall {
    0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }

  .balloon { animation: floatUp 3s ease-in-out infinite; }
  .balloon:nth-child(2) { animation-delay: 0.5s; }
  .balloon:nth-child(3) { animation-delay: 1s; }
  .balloon:nth-child(4) { animation-delay: 1.5s; }

  .bounce-in { animation: bounceIn 0.7s cubic-bezier(.36,.07,.19,.97) both; }

  .fade-up { animation: fadeSlideUp 0.6s ease both; }
  .fade-up:nth-child(1) { animation-delay: 0.1s; }
  .fade-up:nth-child(2) { animation-delay: 0.2s; }
  .fade-up:nth-child(3) { animation-delay: 0.3s; }
  .fade-up:nth-child(4) { animation-delay: 0.4s; }

  .confetti-piece {
    animation: confettiFall linear infinite;
    position: fixed;
    top: -30px;
    z-index: 0;
    pointer-events: none;
  }

  @keyframes carouselFadeIn {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .carousel-img-enter {
    animation: carouselFadeIn 0.5s ease both;
  }

  .dot-btn {
    border: none;
    cursor: pointer;
    padding: 0;
    transition: transform 0.2s, background 0.2s;
  }
  .dot-btn:hover { transform: scale(1.3); }

  .carousel-nav-btn {
    background: rgba(255,255,255,0.25);
    border: 2px solid rgba(255,255,255,0.5);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    color: #fff;
    transition: background 0.2s, transform 0.15s;
    backdrop-filter: blur(4px);
  }
  .carousel-nav-btn:hover {
    background: rgba(255,255,255,0.45);
    transform: scale(1.1);
  }

  .hero-inner {
    display: flex;
    align-items: center;
    gap: 48px;
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }
  .hero-left {
    flex: 1;
    min-width: 260px;
    text-align: left;
  }
  .hero-right {
    flex: 1;
    min-width: 300px;
  }
  @media (max-width: 760px) {
    .hero-inner { flex-direction: column; gap: 28px; }
    .hero-left  { text-align: center; }
    .hero-balloons { justify-content: center !important; }
    .hero-date-badge { justify-content: center !important; }
  }

  input, textarea, select {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #F2D0B0;
    border-radius: 14px;
    font-family: 'Nunito', sans-serif;
    font-size: 15px;
    background: #FFFAF5;
    color: #3D2B1F;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  input:focus, textarea:focus {
    border-color: #FF6B6B;
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.15);
  }
  textarea { resize: vertical; min-height: 90px; }
  label {
    display: block;
    font-weight: 700;
    margin-bottom: 6px;
    font-size: 14px;
    color: #7A4F3A;
  }
`;

// ============================================================
//  Photos du carrousel
//  ⚠️ Placez vos photos dans public/photos/ et renommez-les
// ============================================================
const PHOTOS = [
  { src: "/photos/photo1.jpeg", alt: "Photo 1" },
  { src: "/photos/photo2.jpeg", alt: "Photo 2" },
  { src: "/photos/photo3.jpeg", alt: "Photo 3" },
  { src: "/photos/photo4.jpeg", alt: "Photo 4" },
  { src: "/photos/photo5.jpeg", alt: "Photo 5" },
  { src: "/photos/photo6.jpeg", alt: "Photo 6" },
];

// ============================================================
//  Confetti
// ============================================================
interface ConfettiPiece {
  id: number;
  left: string;
  color: string;
  size: number;
  duration: string;
  delay: string;
  shape: "circle" | "square" | "rect";
}

function Confetti() {
  const pieces: ConfettiPiece[] = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 8 + Math.random() * 8,
    duration: `${5 + Math.random() * 7}s`,
    delay: `${Math.random() * 5}s`,
    shape: (i % 3 === 0 ? "circle" : i % 3 === 1 ? "square" : "rect") as ConfettiPiece["shape"],
  }));

  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.shape === "rect" ? p.size * 2 : p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "square" ? "3px" : "2px",
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </>
  );
}

// ============================================================
//  Carrousel de photos
// ============================================================
function PhotoCarousel() {
  const [current, setCurrent]   = useState(0);
  const [animKey, setAnimKey]   = useState(0);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    setCurrent((index + PHOTOS.length) % PHOTOS.length);
    setAnimKey((k) => k + 1);
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    intervalRef.current = setInterval(next, 3500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [next]);

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, 3500);
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 420, margin: "0 auto" }}>
      {/* Cadre photo avec ombre portée */}
      <div
        style={{
          position: "relative",
          borderRadius: 24,
          overflow: "hidden",
          aspectRatio: "4/3",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 4px rgba(255,255,255,0.3)",
        }}
      >
        <img
          key={animKey}
          src={PHOTOS[current].src}
          alt={PHOTOS[current].alt}
          className="carousel-img-enter"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* Overlay gradient bas */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "35%",
            background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent)",
          }}
        />

        {/* Boutons précédent / suivant */}
        <button
          className="carousel-nav-btn"
          onClick={() => { prev(); resetTimer(); }}
          aria-label="Photo précédente"
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
        >
          ‹
        </button>
        <button
          className="carousel-nav-btn"
          onClick={() => { next(); resetTimer(); }}
          aria-label="Photo suivante"
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}
        >
          ›
        </button>
      </div>

      {/* Indicateurs (dots) */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
        {PHOTOS.map((_, i) => (
          <button
            key={i}
            className="dot-btn"
            onClick={() => { goTo(i); resetTimer(); }}
            aria-label={`Aller à la photo ${i + 1}`}
            style={{
              width: i === current ? 22 : 10,
              height: 10,
              borderRadius: 5,
              background: i === current ? "#fff" : "rgba(255,255,255,0.45)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
//  Section Hero
// ============================================================
function HeroSection() {
  return (
    <section
      style={{
        background: "linear-gradient(135deg, #FF6B6B 0%, #FF9F45 55%, #FFD93D 100%)",
        padding: "52px 40px 60px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Cercles décoratifs */}
      <div style={{ position: "absolute", top: -60, left: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
      <div style={{ position: "absolute", bottom: -80, right: -40, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
      <div style={{ position: "absolute", top: "30%", right: "20%", width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />

      <div className="hero-inner">

        {/* ── Colonne gauche : texte ── */}
        <div className="hero-left">

          {/* Ballons */}
          <div className="hero-balloons" style={{ display: "flex", gap: 14, marginBottom: 20 }}>
            {(["🎈", "🎉", "🎈", "🎊"] as const).map((emoji, i) => (
              <span key={i} className="balloon" style={{ fontSize: 34 }}>{emoji}</span>
            ))}
          </div>

          {/* Sous-titre */}
          <p
            className="bounce-in"
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: "clamp(13px, 2vw, 17px)",
              color: "rgba(255,255,255,0.9)",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Tu es invité(e) à fêter les
          </p>

          {/* Grand chiffre */}
          <h1
            className="bounce-in"
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: "clamp(72px, 12vw, 130px)",
              color: "#fff",
              lineHeight: 1,
              textShadow: "0 8px 0 rgba(0,0,0,0.12)",
              marginBottom: 0,
            }}
          >
            {CONFIG.age}
          </h1>

          {/* Prénom */}
          <p
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: "clamp(26px, 5vw, 48px)",
              color: "#fff",
              textShadow: "0 4px 0 rgba(0,0,0,0.1)",
              marginBottom: 28,
              lineHeight: 1.2,
            }}
          >
            ans de<br />{CONFIG.childName} !
          </p>

          {/* Badge date/heure */}
          <div
            className="hero-date-badge"
            style={{
              display: "inline-flex",
              flexDirection: "column",
              gap: 10,
              background: "rgba(255,255,255,0.22)",
              backdropFilter: "blur(8px)",
              borderRadius: 20,
              padding: "16px 24px",
              border: "1.5px solid rgba(255,255,255,0.35)",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              📅 {CONFIG.date}
            </span>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              🕑 {CONFIG.time}
            </span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
              📍 {CONFIG.locationName}
            </span>
          </div>
        </div>

        {/* ── Colonne droite : carrousel ── */}
        <div className="hero-right">
          <PhotoCarousel />
        </div>

      </div>
    </section>
  );
}



// ============================================================
//  Section Lieu
// ============================================================
function LocationSection() {
  return (
    <section style={{ padding: "64px 24px", maxWidth: 760, margin: "0 auto" }}>
      <SectionTitle emoji="📍" title="Le lieu de la fête" color="#FF6B6B" />

      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "32px 36px",
          boxShadow: "0 8px 40px rgba(255,107,107,0.12)",
          border: "2px solid #FFE4D6",
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 72 }}>🏟️</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#FF6B6B", marginBottom: 6 }}>
            {CONFIG.locationName}
          </h3>
          <p style={{ fontWeight: 700, color: "#7A4F3A", marginBottom: 12, fontSize: 14 }}>
            📌 {CONFIG.locationAddress}
          </p>
          <a
            href={CONFIG.locationMapsUrl}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-block", marginBottom: 14, fontSize: 13, color: "#4D96FF", fontWeight: 700, textDecoration: "none" }}
          >
            🗺️ Voir sur Google Maps →
          </a>
          <p style={{ color: "#6B5044", lineHeight: 1.7 }}>{CONFIG.locationDescription}</p>
        </div>
      </div>
    </section>
  );
}

// ============================================================
//  Section Activités
// ============================================================
function ActivitiesSection() {
  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(-6px)";
  };
  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
  };

  return (
    <section style={{ background: "linear-gradient(180deg, #FFF6ED 0%, #E8F7FF 100%)", padding: "64px 24px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <SectionTitle emoji="🎡" title="Au programme de la journée" color="#4D96FF" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          {ACTIVITIES.map((act) => (
            <div
              key={act.title}
              className="fade-up"
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: "24px 20px",
                textAlign: "center",
                boxShadow: "0 4px 24px rgba(77,150,255,0.1)",
                border: "2px solid #D6EEFF",
                transition: "transform 0.2s",
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div style={{ fontSize: 44, marginBottom: 14 }}>{act.icon}</div>
              <h4 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 19, color: "#4D96FF", marginBottom: 8 }}>
                {act.title}
              </h4>
              <p style={{ fontSize: 14, color: "#6B7F99", lineHeight: 1.6 }}>{act.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
//  Section Prise en charge
// ============================================================
function PriseEnChargeSection() {
  return (
    <section style={{ padding: "0 24px 64px" }}>
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          background: "linear-gradient(135deg, #845EC2 0%, #C77DFF 100%)",
          borderRadius: 28,
          padding: "40px 36px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />

        <div style={{ textAlign: "center", marginBottom: 32, position: "relative" }}>
          <span style={{ fontSize: 36 }}>🎁</span>
          <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "clamp(22px, 4vw, 30px)", color: "#fff", marginTop: 8 }}>
            Tout est pris en charge pour votre enfant !
          </h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, marginTop: 8 }}>
            Vous n'avez rien à prévoir — on s'occupe de tout pour les enfants 💜
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, position: "relative" }}>
          {CHARGES.map((c) => (
            <div
              key={c.label}
              style={{
                background: "rgba(255,255,255,0.18)",
                borderRadius: 20,
                padding: "22px 18px",
                textAlign: "center",
                border: "1.5px solid rgba(255,255,255,0.3)",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>{c.icon}</div>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{c.label}</p>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.5 }}>{c.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
//  Indicateur de progression RSVP
// ============================================================
interface StepIndicatorProps {
  currentStep: number;
  canCome: Answer | null;
}

function StepIndicator({ currentStep, canCome }: StepIndicatorProps) {
  if (currentStep === 5 || canCome === "no") return null;

  const activeIndex = currentStep - 1;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
      {STEPS_LABELS.map((label, i) => {
        const done   = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: done ? "#6BCB77" : active ? "#FF9F45" : "#EDE0D4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 13,
                  color: done || active ? "#fff" : "#B0957E",
                  transition: "all 0.3s",
                  boxShadow: active ? "0 0 0 4px rgba(255,159,69,0.25)" : "none",
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: active ? "#FF9F45" : done ? "#6BCB77" : "#B0957E",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < STEPS_LABELS.length - 1 && (
              <div
                style={{
                  width: 40,
                  height: 2,
                  background: done ? "#6BCB77" : "#EDE0D4",
                  margin: "0 4px",
                  marginBottom: 18,
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
//  Section RSVP
// ============================================================
function RSVPSection() {
  const [step, setStep]                 = useState<number>(1);
  const [canCome, setCanCome]           = useState<Answer | null>(null);
  const [parentComing, setParentComing] = useState<Answer | null>(null);
  const [sending, setSending]           = useState<boolean>(false);
  const [sendError, setSendError]       = useState<string | null>(null);

  const [childInfo, setChildInfo]   = useState<ChildInfo>({ firstName: "", lastName: "", allergies: "", message: "" });
  const [parentInfo, setParentInfo] = useState<ParentInfo>({ firstName: "", lastName: "", phone: "", email: "" });

  const updateChild  = (field: keyof ChildInfo,  val: string) => setChildInfo((prev)  => ({ ...prev, [field]: val }));
  const updateParent = (field: keyof ParentInfo, val: string) => setParentInfo((prev) => ({ ...prev, [field]: val }));

  // ── Envoi de l'email via EmailJS ──
  const sendEmail = async (templateParams: Record<string, string>) => {
    setSending(true);
    setSendError(null);
    try {
      await emailjs.send(
        EMAILJS.serviceId,
        EMAILJS.templateId,
        templateParams,
        EMAILJS.publicKey,
      );
    } catch (err) {
      console.error("EmailJS error:", err);
      setSendError("L'email n'a pas pu être envoyé. Contactez-nous directement.");
    } finally {
      setSending(false);
    }
  };

  // Étape 1 — Participation
  const handleCanCome = async (val: Answer) => {
    setCanCome(val);
    if (val === "no") {
      await sendEmail({
        presence:        "❌ Ne viendra pas",
        child_firstname: "—",
        child_lastname:  "—",
        allergies:       "—",
        message:         "—",
        parent_coming:   "—",
        parent_firstname:"—",
        parent_lastname: "—",
        parent_phone:    "—",
        parent_email:    "—",
      });
      setStep(5);
    } else {
      setStep(2);
    }
  };

  // Étape 2 — Infos enfant
  const handleChildSubmit = () => {
    if (!childInfo.firstName.trim()) {
      alert("Veuillez indiquer le prénom de l'enfant.");
      return;
    }
    setStep(3);
  };

  // Étape 3 — Accompagnateur
  const handleParentDecision = async (val: Answer) => {
    setParentComing(val);
    if (val === "no") {
      await sendEmail({
        presence:         "✅ Viendra",
        child_firstname:  childInfo.firstName,
        child_lastname:   childInfo.lastName  || "—",
        allergies:        childInfo.allergies || "Aucune",
        message:          childInfo.message   || "—",
        parent_coming:    "Non — reviendra chercher l'enfant",
        parent_firstname: "—",
        parent_lastname:  "—",
        parent_phone:     "—",
        parent_email:     "—",
      });
      setStep(5);
    } else {
      setStep(4);
    }
  };

  // Étape 4 — Infos parent
  const handleFinalSubmit = async () => {
    if (!parentInfo.firstName.trim() || !parentInfo.phone.trim()) {
      alert("Veuillez remplir les champs obligatoires (prénom et téléphone).");
      return;
    }
    await sendEmail({
      presence:         "✅ Viendra",
      child_firstname:  childInfo.firstName,
      child_lastname:   childInfo.lastName  || "—",
      allergies:        childInfo.allergies || "Aucune",
      message:          childInfo.message   || "—",
      parent_coming:    "Oui — restera avec les enfants",
      parent_firstname: parentInfo.firstName,
      parent_lastname:  parentInfo.lastName  || "—",
      parent_phone:     parentInfo.phone,
      parent_email:     parentInfo.email     || "—",
    });
    setStep(5);
  };

  const parentWillCome = parentComing === "yes";

  return (
    <section style={{ padding: "64px 24px 80px", maxWidth: 680, margin: "0 auto" }}>
      <SectionTitle emoji="✉️" title="Répondre à l'invitation" color="#6BCB77" />

      <p style={{ textAlign: "center", color: "#7A4F3A", marginBottom: 36, fontSize: 15 }}>
        Merci de répondre avant le <strong>{CONFIG.rsvpDeadline}</strong>
      </p>

      <div
        style={{
          background: "#fff",
          borderRadius: 28,
          padding: "36px 32px",
          boxShadow: "0 12px 50px rgba(107,203,119,0.15)",
          border: "2px solid #C5EFCC",
        }}
      >
        <StepIndicator currentStep={step} canCome={canCome} />

        {/* Étape 1 — Participation */}
        {step === 1 && (
          <FadeBox>
            <QuestionTitle>
              Votre enfant pourra-t-il venir fêter les {CONFIG.age} ans de{" "}
              <strong style={{ color: "#6BCB77" }}>{CONFIG.childName}</strong> ?
            </QuestionTitle>
            <div style={{ display: "flex", gap: 14, marginTop: 28, justifyContent: "center", flexWrap: "wrap" }}>
              <ChoiceButton color="#6BCB77" onClick={() => handleCanCome("yes")} disabled={sending}>🎉 Oui, il/elle vient !</ChoiceButton>
              <ChoiceButton color="#FF6B6B" onClick={() => handleCanCome("no")}  disabled={sending}>😢 Non, malheureusement</ChoiceButton>
            </div>
            {sending && <SendingIndicator />}
          </FadeBox>
        )}

        {/* Étape 2 — Infos enfant */}
        {step === 2 && (
          <FadeBox>
            <QuestionTitle>Super ! Parlez-nous de votre enfant 🎈</QuestionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
              <Field label="Prénom *">
                <input value={childInfo.firstName} onChange={(e) => updateChild("firstName", e.target.value)} placeholder="Prénom" />
              </Field>
              <Field label="Nom">
                <input value={childInfo.lastName} onChange={(e) => updateChild("lastName", e.target.value)} placeholder="Nom de famille" />
              </Field>
            </div>
            <div style={{ marginTop: 16 }}>
              <Field label="Allergies ou régimes alimentaires particuliers">
                <input value={childInfo.allergies} onChange={(e) => updateChild("allergies", e.target.value)} placeholder="Aucune allergie connue..." />
              </Field>
            </div>
            <div style={{ marginTop: 16 }}>
              <Field label={`Un petit mot pour ${CONFIG.childName} ? 💌`}>
                <textarea value={childInfo.message} onChange={(e) => updateChild("message", e.target.value)} placeholder="Bon anniversaire ! J'ai hâte de te voir..." />
              </Field>
            </div>
            <div style={{ marginTop: 24, textAlign: "right" }}>
              <ActionButton onClick={handleChildSubmit}>Continuer →</ActionButton>
            </div>
          </FadeBox>
        )}

        {/* Étape 3 — Accompagnateur */}
        {step === 3 && (
          <FadeBox>
            <QuestionTitle>
              Un parent souhaite-t-il accompagner{" "}
              <strong style={{ color: "#FF9F45" }}>{childInfo.firstName}</strong> ? 👨‍👩‍👧
            </QuestionTitle>
            <div
              style={{
                background: "#FFF8EE",
                border: "2px solid #FFE0B0",
                borderRadius: 16,
                padding: "14px 18px",
                marginTop: 18,
                marginBottom: 8,
                fontSize: 14,
                color: "#7A5C2E",
                lineHeight: 1.6,
              }}
            >
              <strong>💡 Bon à savoir :</strong> les enfants sont entièrement pris en charge (entrée, transport, repas).
              Les parents accompagnateurs sont les bienvenus mais règlent leur propre entrée au parc (1 € symbolique).
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 24, justifyContent: "center", flexWrap: "wrap" }}>
              <ChoiceButton color="#FF9F45" onClick={() => handleParentDecision("yes")} disabled={sending}>👋 Oui, je reste avec les enfants !</ChoiceButton>
              <ChoiceButton color="#C77DFF" onClick={() => handleParentDecision("no")}  disabled={sending}>🚗 Non, je reviendrai chercher</ChoiceButton>
            </div>
            {sending && <SendingIndicator />}
          </FadeBox>
        )}

        {/* Étape 4 — Infos parent */}
        {step === 4 && (
          <FadeBox>
            <QuestionTitle>Parfait ! Vos coordonnées 😊</QuestionTitle>
            <p style={{ textAlign: "center", fontSize: 14, color: "#888", marginTop: 6, marginBottom: 20 }}>
              Pour qu'on puisse vous tenir informé(e) et organiser le covoiturage
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Votre prénom *">
                <input value={parentInfo.firstName} onChange={(e) => updateParent("firstName", e.target.value)} placeholder="Prénom" />
              </Field>
              <Field label="Votre nom">
                <input value={parentInfo.lastName} onChange={(e) => updateParent("lastName", e.target.value)} placeholder="Nom" />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <Field label="Téléphone *">
                <input value={parentInfo.phone} onChange={(e) => updateParent("phone", e.target.value)} placeholder="06 00 00 00 00" type="tel" />
              </Field>
              <Field label="Email">
                <input value={parentInfo.email} onChange={(e) => updateParent("email", e.target.value)} placeholder="votre@email.com" type="email" />
              </Field>
            </div>
            <div style={{ marginTop: 28, textAlign: "right" }}>
              <ActionButton onClick={handleFinalSubmit} disabled={sending}>
                {sending ? "Envoi en cours…" : "Envoyer ma réponse 🎉"}
              </ActionButton>
            </div>
            {sendError && <ErrorMessage message={sendError} />}
          </FadeBox>
        )}

        {/* Étape 5 — Confirmation */}
        {step === 5 && (
          <FadeBox>
            {canCome === "yes" ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 30, color: "#6BCB77", marginBottom: 12 }}>
                  Super, on vous attend !
                </h3>
                <p style={{ color: "#6B5044", lineHeight: 1.7, marginBottom: 16 }}>
                  Merci pour votre réponse !<br />
                  <strong>{childInfo.firstName}</strong> sera attendu(e) le{" "}
                  <strong>{CONFIG.date}</strong> à <strong>{CONFIG.time}</strong>.
                </p>
                {parentWillCome && (
                  <p style={{ color: "#6B5044", lineHeight: 1.7, marginBottom: 16 }}>
                    Nous sommes ravis que <strong>{parentInfo.firstName}</strong> accompagne son enfant ! 😊
                  </p>
                )}
                <div style={{ background: "#F0FBF1", border: "2px solid #C5EFCC", borderRadius: 16, padding: "16px 20px", fontSize: 14, color: "#3D7A45" }}>
                  <p>
                    Pour toute question, contactez {CONFIG.hostName} :<br />
                    📞 {CONFIG.hostPhone} · ✉️ {CONFIG.hostEmail}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 72, marginBottom: 16 }}>😢</div>
                <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: "#FF6B6B", marginBottom: 12 }}>
                  On sera tristes sans vous !
                </h3>
                <p style={{ color: "#6B5044", lineHeight: 1.7 }}>
                  Merci d'avoir répondu. On espère vous retrouver une prochaine fois ! 💛
                </p>
              </div>
            )}
          </FadeBox>
        )}
      </div>
    </section>
  );
}

// ============================================================
//  Footer
// ============================================================
function Footer() {
  return (
    <footer style={{ background: "#3D2B1F", color: "rgba(255,255,255,0.7)", textAlign: "center", padding: "32px 24px", fontSize: 14 }}>
      <p style={{ marginBottom: 6 }}>🎂 Organisé par {CONFIG.hostName}</p>
      <p>📞 {CONFIG.hostPhone} · ✉️ {CONFIG.hostEmail}</p>
    </footer>
  );
}

// ============================================================
//  Composants utilitaires
// ============================================================
interface SectionTitleProps { emoji: string; title: string; color: string; }

function SectionTitle({ emoji, title, color }: SectionTitleProps) {
  return (
    <div style={{ textAlign: "center", marginBottom: 36 }}>
      <span style={{ fontSize: 36 }}>{emoji}</span>
      <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "clamp(26px, 5vw, 36px)", color, marginTop: 8 }}>
        {title}
      </h2>
      <div style={{ width: 60, height: 4, background: color, borderRadius: 4, margin: "12px auto 0", opacity: 0.5 }} />
    </div>
  );
}

function QuestionTitle({ children }: { children: ReactNode }) {
  return (
    <p style={{ textAlign: "center", fontFamily: "'Fredoka One', cursive", fontSize: 22, color: "#3D2B1F", lineHeight: 1.4 }}>
      {children}
    </p>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
}

interface ButtonProps { color: string; onClick: () => void; children: ReactNode; disabled?: boolean; }

function ChoiceButton({ color, onClick, children, disabled = false }: ButtonProps) {
  const handleEnter = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = "scale(1.05)";
    e.currentTarget.style.boxShadow = `0 6px 22px ${color}88`;
  };
  const handleLeave = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = `0 4px 16px ${color}55`;
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      disabled={disabled}
      style={{
        padding: "14px 22px",
        background: disabled ? "#CCC" : color,
        color: "#fff",
        border: "none",
        borderRadius: 18,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: 15,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
        boxShadow: disabled ? "none" : `0 4px 16px ${color}55`,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function ActionButton({ onClick, children, disabled = false }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  const handleEnter = (e: MouseEvent<HTMLButtonElement>) => { if (!disabled) e.currentTarget.style.transform = "scale(1.04)"; };
  const handleLeave = (e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = "scale(1)"; };

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      disabled={disabled}
      style={{
        padding: "14px 28px",
        background: disabled ? "#AAA" : "linear-gradient(135deg, #6BCB77, #4CAF50)",
        color: "#fff",
        border: "none",
        borderRadius: 16,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: 16,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
        boxShadow: disabled ? "none" : "0 4px 18px rgba(107,203,119,0.4)",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SendingIndicator() {
  return (
    <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#FF9F45", fontWeight: 700 }}>
      ⏳ Envoi de la confirmation en cours…
    </p>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p style={{ textAlign: "center", marginTop: 12, fontSize: 14, color: "#FF6B6B", fontWeight: 700 }}>
      ⚠️ {message}
    </p>
  );
}

function FadeBox({ children }: { children: ReactNode }) {
  return <div style={{ animation: "fadeSlideUp 0.4s ease both" }}>{children}</div>;
}

// ============================================================
//  App principale
// ============================================================
export default function BirthdayInvitation() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = globalCSS;
    document.head.appendChild(style);
    document.title = `Anniversaire de ${CONFIG.childName} 🎂`;
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Confetti />
      <HeroSection />
      <LocationSection />
      <ActivitiesSection />
      <PriseEnChargeSection />
      <RSVPSection />
      <Footer />
    </div>
  );
}