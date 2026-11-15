"use client";
import { CinematicHero } from "@/components/dashboard/cinematic-hero";
import { Reveal } from "@/components/motion/reveal";
import { apiFetch } from "@/lib/api";
import type { Journey } from "@/lib/types";
import {
  ArrowRight,
  ArrowUpRight,
  Coffee,
  Compass,
  MessagesSquare,
  ShieldCheck,
  Ticket,
  TrainFront,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
const experiences = [
  {
    n: "01",
    title: "Find your people.",
    subtitle: "THE CARRIAGE COMMUNITY",
    text: "A shared route. A new conversation. Meet the people making the same journey.",
    image: "surreal_celestial_junction",
    href: "/communities",
    icon: MessagesSquare,
  },
  {
    n: "02",
    title: "Take the scenic route.",
    subtitle: "A WINDOW TO WONDER",
    text: "From the ghats to the Western Ghats. Let your curiosity travel a little further.",
    image: "surreal_window_safar",
    href: "/explore",
    icon: Compass,
  },
  {
    n: "03",
    title: "Chai. Chat. Checkmate.",
    subtitle: "BETTER IN GOOD COMPANY",
    text: "Turn the time between stations into a story. A quick game is a lovely place to start.",
    image: "post_railway_chai",
    href: "/games",
    icon: Coffee,
  },
];
export default function HomePage() {
  const router = useRouter();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [number, setNumber] = useState("");
  const [date, setDate] = useState("");
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    (async () => {
      try {
        const s = await apiFetch<{ authenticated: boolean }>("/auth/session", {
          signal: c.signal,
        });
        if (s.authenticated) {
          const j = await apiFetch<{ journeys: Journey[] }>("/journeys", {
            signal: c.signal,
          });
          setJourneys(j.journeys);
        }
      } catch (e) {
        if (!c.signal.aborted) setLoadError(true);
      } finally {
        if (!c.signal.aborted) setLoaded(true);
      }
    })();
    return () => c.abort();
  }, []);
  function findTrain(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (number.trim()) q.set("train", number.trim());
    if (date) q.set("date", date);
    router.push(`/journeys/new/manual?${q}`);
  }
  return (
    <div className="rb-home">
      <div className="rb-page-intro">
        <div>
          <span className="rb-eyebrow">SAFAR. SAATH. STORIES.</span>
          <h2>
            A window to <em>something wonderful.</em>
          </h2>
        </div>
        <span className="rb-intro-note">
          <span lang="hi">नमस्ते</span> / Welcome aboard
        </span>
      </div>
      <CinematicHero
        onFindTrain={() => document.getElementById("train-number")?.focus()}
        onExploreCommunities={() =>
          document.getElementById("experience")?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
          })
        }
      />
      <form className="rb-find-train" onSubmit={findTrain}>
        <div className="rb-find-intro">
          <span className="rb-icon-tile">
            <TrainFront size={23} />
          </span>
          <div>
            <h2>Your journey starts here.</h2>
            <p>Find the community on your route.</p>
          </div>
        </div>
        <label htmlFor="train-number">
          <span>TRAIN NUMBER</span>
          <input
            id="train-number"
            name="train"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="e.g. 12723"
            inputMode="numeric"
            pattern="[0-9]{5}"
            minLength={5}
            maxLength={5}
            required
            autoComplete="off"
          />
        </label>
        <label htmlFor="journey-date">
          <span>DEPARTURE DATE</span>
          <input
            id="journey-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <button className="rb-button" type="submit">
          Find my journey <ArrowUpRight size={19} />
        </button>
      </form>
      <div className="rb-trust-row">
        <span>
          <ShieldCheck size={15} /> Anonymous by choice
        </span>
        <i />
        <span>
          <Ticket size={15} /> Your ticket stays private
        </span>
        <i />
        <span>
          <MessagesSquare size={15} /> Real conversations, shared journeys
        </span>
        <Link href="/help">
          How it works <ArrowRight size={14} />
        </Link>
      </div>
      {loaded && (journeys.length > 0 || loadError) && (
        <Reveal>
          <section className="rb-your-journeys">
            <div className="rb-section-heading">
              <div>
                <span className="rb-eyebrow">YOUR NEXT CHAPTER</span>
                <h2>{loadError ? "Let’s reconnect." : "Back on the rails."}</h2>
              </div>
              <Link href="/journeys">
                All journeys <ArrowUpRight size={18} />
              </Link>
            </div>
            {loadError ? (
              <p role="status">
                We couldn’t load your journeys. Open My journeys to try again.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {journeys.slice(0, 2).map((j) => (
                  <Link
                    className="rb-journey-preview"
                    key={j.id}
                    href={`/journeys/${j.id}`}
                  >
                    <span className="rb-icon-tile">
                      <TrainFront size={23} />
                    </span>
                    <div>
                      <span className="rb-eyebrow">
                        {j.train?.number} · {j.journey_date}
                      </span>
                      <h3>{j.train?.name || "Your train"}</h3>
                      <p>
                        {j.boarding_station?.name} <ArrowRight size={14} />{" "}
                        {j.destination_station?.name}
                      </p>
                    </div>
                    <ArrowUpRight size={22} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </Reveal>
      )}
      <Reveal>
        <section id="experience" className="rb-experiences">
          <div className="rb-section-heading">
            <div>
              <span className="rb-eyebrow">MORE THAN A DESTINATION</span>
              <h2>
                It’s the <em>in-between</em> that stays.
              </h2>
            </div>
            <Link href="/explore">
              Find your kind of journey <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="rb-experience-grid">
            {experiences.map(
              ({ n, title, subtitle, text, image, href, icon: Icon }) => (
                <Link href={href} key={n} className="rb-experience-card">
                  <div
                    className={`rb-experience-image rb-experience-image-${n}`}
                  >
                    <Image
                      src={`/images/${image}.webp`}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 28vw"
                      alt=""
                    />
                    <span className="rb-card-number">{n} /</span>
                    <span className="rb-card-arrow">
                      <ArrowUpRight size={21} />
                    </span>
                  </div>
                  <div className="rb-experience-text">
                    <span className="rb-eyebrow">
                      <Icon size={13} />
                      {subtitle}
                    </span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </Link>
              ),
            )}
          </div>
        </section>
      </Reveal>
      <Reveal>
        <section className="rb-story-banner">
          <div className="rb-story-image">
            <Image
              src="/images/travel_promo_banner.webp"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              alt="Riverfront ghats and Indian architecture in warm evening light"
            />
          </div>
          <div className="rb-story-copy">
            <span className="rb-eyebrow">
              MANY CULTURES. A MILLION STORIES. ONE INDIA.
            </span>
            <h2>
              From <em>namaste</em>
              <br />
              to “see you again.”
            </h2>
            <p>
              Different cities, different traditions, the same love for the
              journey. There’s room for every story here, including yours.
            </p>
            <Link href="/signup" className="rb-button">
              Be part of the journey <ArrowUpRight size={18} />
            </Link>
          </div>
          <span className="rb-story-seal" aria-hidden="true">
            साथ
            <br />
            <small>SAATH</small>
          </span>
        </section>
      </Reveal>
    </div>
  );
}
