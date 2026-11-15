import {
  ArrowUpRight,
  LockKeyhole,
  Phone,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Help, privacy & safety" };
const faqs = [
  {
    q: "How do I join a journey?",
    a: "Create an account and choose your anonymous handle. Enter the train number, travel date and stations from your ticket, or upload a PDF or image to extract the details. Review them before joining the community.",
  },
  {
    q: "Are travellers verified by Indian Railways?",
    a: "No. RailBandhan is an independent community. Journey membership is based on details travellers provide. Reading a ticket does not verify it with Indian Railways or prove that someone is physically on the train. Treat new contacts with the same care you would anywhere else.",
  },
  {
    q: "What can other travellers see?",
    a: "Your handle, public bio and reputation appear in community interactions. Your email and private profile are not included in passenger listings. Discovery is optional. Choose who can message you in your privacy settings.",
  },
  {
    q: "What happens to my uploaded ticket?",
    a: "The server extracts journey details locally. Your ticket is encrypted on disk and deleted after you confirm the extraction. Abandoned uploads are removed by the scheduled retention job, with a default limit of 24 hours. Ticket fields remain private to your account. You can delete your account from your profile.",
  },
  {
    q: "Are live train locations exact?",
    a: "A running-status provider may supply a recent observation. When it is unavailable, RailBandhan can show a timetable estimate, clearly labelled with its source and update time. An estimate is not GPS tracking. Confirm travel decisions with official railway information.",
  },
  {
    q: "Can I play or chat without a connection?",
    a: "Chat, shared games and fresh train updates need a network connection. Previously loaded artwork may remain available offline. Failed actions show an error so you can retry when connected.",
  },
  {
    q: "How do I deal with unwanted contact?",
    a: "Use the report or block actions in conversations and passenger views. Blocks prevent further direct messages and hide blocked people from discovery and community content. Reports go to the moderation queue. RailBandhan is not an emergency service.",
  },
];
export default function HelpPage() {
  return (
    <div>
      <div className="rb-route-title">
        <span className="rb-eyebrow">
          TRAVEL WITH A LITTLE MORE PEACE OF MIND
        </span>
        <h1>
          Good journeys begin
          <br />
          with <em>feeling safe.</em>
        </h1>
        <p>
          Clear privacy choices, an anonymous handle and a little care for one
          another. Here’s how RailBandhan works.
        </p>
      </div>
      <div className="rb-safety-grid">
        {[
          {
            icon: ShieldCheck,
            title: "Your identity. Your choice.",
            text: "Share your story through an anonymous handle. Keep personal contact details, ticket numbers and exact seat details out of public conversations.",
          },
          {
            icon: LockKeyhole,
            title: "A private travel pass.",
            text: "Your account details and ticket extraction stay separate from your public profile. Discovery is an opt-in setting you can change.",
          },
          {
            icon: UsersRound,
            title: "A little kindness goes far.",
            text: "Respect different languages, cultures and boundaries. Ask before messaging, avoid sharing anyone’s details, and report behaviour that feels wrong.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className="rb-safety-card">
            <Icon size={28} strokeWidth={1.5} />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <section className="my-10">
        <div className="rb-section-heading">
          <div>
            <span className="rb-eyebrow">OFFICIAL HELP, WHEN YOU NEED IT</span>
            <h2>
              Help is a <em>call away.</em>
            </h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <article className="rb-safety-card">
            <Phone size={25} />
            <h3>139 · RailMadad</h3>
            <p>
              Railway assistance, security, medical help and passenger
              complaints.
            </p>
            <a href="tel:139" className="rb-button">
              Call 139 <ArrowUpRight size={17} />
            </a>
            <p className="mt-4">
              <a
                href="https://railmadad.indianrailways.gov.in/"
                target="_blank"
                rel="noreferrer"
              >
                Official RailMadad website
              </a>
            </p>
          </article>
          <article className="rb-safety-card">
            <Phone size={25} />
            <h3>112 · Emergency response</h3>
            <p>
              India’s unified emergency number for police, fire and medical
              emergencies.
            </p>
            <a href="tel:112" className="rb-button">
              Call 112 <ArrowUpRight size={17} />
            </a>
            <p className="mt-4">
              <a href="https://112.gov.in/" target="_blank" rel="noreferrer">
                Official emergency response website
              </a>
            </p>
          </article>
        </div>
      </section>
      <section>
        <div className="rb-section-heading">
          <div>
            <span className="rb-eyebrow">
              THE THINGS YOU MIGHT BE WONDERING
            </span>
            <h2>A few useful answers.</h2>
          </div>
          <Link href="/profile">
            Privacy settings <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="rb-faq">
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <p className="text-xs text-[var(--rail-text-muted)] mt-5">
          RailBandhan is independent of Indian Railways and IRCTC. Official
          assistance links checked on 15 November 2026.
        </p>
      </section>
    </div>
  );
}
