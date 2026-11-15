"use client";
import { Reveal } from "@/components/motion/reveal";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import type { Train } from "@/lib/types";
import { ArrowUpRight, Search, TrainFront } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
const chapters = [
  {
    tag: "RIVERS & REVERENCE",
    title: "A slower kind of evening.",
    text: "Riverfront conversations, the glow of a diya, and a city finding its own rhythm. Some moments ask you to linger.",
    image: "travel_promo_banner",
  },
  {
    tag: "THE WINDOW SEAT",
    title: "A different India, every mile.",
    text: "Mountains give way to fields, cities to coastlines. Keep a little room for the world outside your window.",
    image: "sidebar_train_scenic",
  },
  {
    tag: "THE SMALL RITUALS",
    title: "There’s always room for chai.",
    text: "A cup passed across a carriage. A snack shared with a stranger. The little things that turn travel into togetherness.",
    image: "post_railway_chai",
  },
];
export default function ExplorePage() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    apiFetch<{ trains: Train[] }>("/catalog/trains", { signal: c.signal })
      .then((x) => setTrains(x.trains))
      .catch(() => {
        if (!c.signal.aborted)
          setError(
            "The route catalog isn’t available right now. Please try again later.",
          );
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, []);
  const filtered = trains.filter((t) =>
    (t.number + " " + t.name)
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <div>
      <div className="rb-route-title">
        <span className="rb-eyebrow">A COUNTRY BEST SEEN TOGETHER</span>
        <h1>
          India isn’t just a place.
          <br />
          <em>It’s a feeling.</em>
        </h1>
        <p>
          Many languages, many traditions, many ways to say welcome. Take a
          little of each with you, wherever the rails lead.
        </p>
      </div>
      <div className="rb-discover-grid">
        {chapters.map((c) => (
          <Reveal key={c.tag}>
            <article className="rb-destination">
              <div className="rb-destination-photo">
                <Image
                  src={`/images/${c.image}.webp`}
                  fill
                  sizes="(max-width:768px) 90vw, 28vw"
                  alt=""
                />
                <span>{c.tag}</span>
              </div>
              <div className="rb-destination-text">
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <Link href="/journeys/new">
                  Start your next chapter <ArrowUpRight size={16} />
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <section className="mt-12">
        <div className="rb-section-heading">
          <div>
            <span className="rb-eyebrow">THE ROUTE CATALOG</span>
            <h2>
              Where are you <em>headed?</em>
            </h2>
          </div>
        </div>
        <div className="rb-search-catalog">
          <Input
            id="catalog-search"
            label="Find a train by name or number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try Telangana or 12723"
            leftIcon={<Search size={17} />}
          />
        </div>
        <p className="text-xs text-[var(--rail-text-muted)] mb-5">
          These are the routes currently available in RailBandhan. Check your
          ticket for the train number and journey date.
        </p>
        {loading ? (
          <div className="rb-loading" role="status">
            Opening the route catalog…
          </div>
        ) : error ? (
          <div role="alert" className="rb-error-message">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rb-loading" role="status">
            No matching train in the current catalog. Try another name or
            number.
          </div>
        ) : (
          <div className="rb-catalog-list">
            {filtered.map((t) => (
              <Link
                className="rb-catalog-row"
                key={t.id}
                href={`/journeys/new/manual?train=${encodeURIComponent(t.number)}`}
              >
                <span className="rb-icon-tile">
                  <TrainFront size={21} />
                </span>
                <span>
                  <small>{t.number}</small>
                  <br />
                  <strong>{t.name}</strong>
                </span>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
