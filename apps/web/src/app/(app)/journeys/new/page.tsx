import { ArrowUpRight, Ticket, TrainFront } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
export default function NewJourneyPage() {
  return (
    <div>
      <div className="rb-route-title">
        <span className="rb-eyebrow">SOMEWHERE NEW. SOMEONE NEW.</span>
        <h1>
          Let’s find
          <br />
          <em>your next bandhan.</em>
        </h1>
        <p>
          Choose how you’d like to add your journey. Your train number, date and
          route connect you with the right community.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-7">
        {[
          {
            href: "/journeys/new/upload",
            title: "Bring your ticket.",
            description:
              "Upload a PDF or image of your e-ticket. We’ll read the details so you can check them before joining.",
            image: "hero_train_window",
            icon: Ticket,
            action: "Read my ticket",
          },
          {
            href: "/journeys/new/manual",
            title: "Know your route?",
            description:
              "Enter your train number, travel date and stations from your ticket. No document upload needed.",
            image: "post_sunset_track",
            icon: TrainFront,
            action: "Enter my journey",
          },
        ].map(({ href, title, description, image, icon: Icon, action }) => (
          <Link key={href} href={href} className="rb-destination group">
            <div className="rb-destination-photo">
              <Image
                src={`/images/${image}.webp`}
                alt=""
                fill
                sizes="(max-width:768px) 90vw, 42vw"
                className="object-cover"
              />
            </div>
            <div className="rb-destination-text">
              <Icon size={25} strokeWidth={1.4} />
              <h2 className="font-display text-3xl font-normal my-4">
                {title}
              </h2>
              <p>{description}</p>
              <span className="inline-flex items-center gap-4 text-xs text-[#a34e2f] mt-4">
                {action}
                <ArrowUpRight size={17} />
              </span>
            </div>
          </Link>
        ))}
      </div>
      <p className="text-xs text-[var(--rail-text-muted)] mt-7">
        RailBandhan is an independent community. Self-declared journey details
        and ticket extraction do not prove that a traveller is physically on a
        train.
      </p>
    </div>
  );
}
