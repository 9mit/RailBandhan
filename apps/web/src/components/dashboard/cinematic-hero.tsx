"use client";
import { ArrowUpRight, Pause, Play, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
export function CinematicHero({
  onFindTrain,
  onExploreCommunities,
}: {
  onFindTrain?: () => void;
  onExploreCommunities?: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<"journey" | "dream">("journey");
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const el = video.current;
    const pause = () => {
      el?.pause();
      setPlaying(false);
    };
    const start = () => {
      if (
        !media.matches &&
        !connection?.saveData &&
        !/2g/.test(connection?.effectiveType || "") &&
        !document.hidden &&
        mode === "journey"
      )
        el?.play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
    };
    const visibility = () => (document.hidden ? pause() : start());
    media.addEventListener("change", pause);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) start();
        else pause();
      },
      { threshold: 0.1 },
    );
    if (el) observer.observe(el);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", pause);
      document.removeEventListener("visibilitychange", visibility);
      pause();
    };
  }, [mode]);
  function toggle() {
    if (playing) {
      video.current?.pause();
      setPlaying(false);
    } else {
      video.current
        ?.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  }
  return (
    <section className="rb-hero" aria-labelledby="hero-title">
      <div className="rb-hero-media">
        <Image
          src={
            mode === "dream"
              ? "/images/surreal_cosmic_train_odyssey.webp"
              : "/images/hero_train_window.webp"
          }
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 85vw"
          alt=""
          className="rb-hero-poster"
        />
        {mode === "journey" && (
          <video
            ref={video}
            className="rb-hero-video"
            muted
            loop
            playsInline
            preload="none"
            poster="/images/hero_train_window.webp"
            aria-hidden="true"
          >
            <source src="/videos/hero_train_journey.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      <div className="rb-hero-shade" />
      <div className="rb-hero-top">
        <span className="rb-eyebrow">
          <i /> THE GREAT INDIAN CONNECTION
        </span>
        <div className="rb-atmosphere" aria-label="Hero atmosphere">
          <button
            aria-pressed={mode === "journey"}
            onClick={() => setMode("journey")}
          >
            The journey
          </button>
          <button
            aria-pressed={mode === "dream"}
            onClick={() => setMode("dream")}
          >
            <Sparkles size={12} /> The dream
          </button>
        </div>
      </div>
      <div className="rb-hero-copy">
        <span className="rb-hero-hindi" lang="hi">
          सफ़र खूबसूरत है, साथ हो तो और भी।
        </span>
        <h1 id="hero-title">
          Some journeys
          <br />
          take you places.
          <br />
          <em>Some bring you closer.</em>
        </h1>
        <p>
          Beyond the window, a thousand Indias.
          <br />
          Beside you, a story waiting to be shared.
        </p>
        <div className="rb-hero-actions">
          {onFindTrain ? (
            <button onClick={onFindTrain} className="rb-button rb-button-cream">
              Find my train <ArrowUpRight size={19} />
            </button>
          ) : (
            <Link href="/journeys/new" className="rb-button rb-button-cream">
              Find my train <ArrowUpRight size={19} />
            </Link>
          )}
          {onExploreCommunities ? (
            <button
              className="rb-hero-secondary"
              onClick={onExploreCommunities}
            >
              Explore the experience <span>↓</span>
            </button>
          ) : (
            <Link href="/explore" className="rb-hero-secondary">
              Explore India <span>↓</span>
            </Link>
          )}
        </div>
      </div>
      <div className="rb-hero-bottom">
        <span>
          01 <i />{" "}
          {mode === "journey"
            ? "THE ART OF TRAVELLING TOGETHER"
            : "A LITTLE WONDER, BETWEEN STATIONS"}
        </span>
        {mode === "journey" && (
          <button
            onClick={toggle}
            className="rb-video-control"
            aria-label={
              playing ? "Pause background video" : "Play background video"
            }
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
            <span>{playing ? "Pause film" : "Play film"}</span>
          </button>
        )}
      </div>
    </section>
  );
}
