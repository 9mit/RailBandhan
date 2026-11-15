"use client";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiUpload } from "@/lib/api";
import { formatErrorMessage } from "@/lib/format-error";
import { ArrowLeft, ArrowUpRight, ShieldCheck, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
export default function UploadPage() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  async function submit(chosen?: File) {
    if (!chosen || busy) return;
    setError("");
    if (chosen.size > 8 * 1024 * 1024) {
      setError("Choose a ticket file smaller than 8 MB.");
      return;
    }
    if (!["application/pdf", "image/png", "image/jpeg"].includes(chosen.type)) {
      setError("Choose a PDF, PNG or JPEG ticket.");
      return;
    }
    setFile(chosen);
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", chosen);
      const result = await apiUpload<{ extraction_id: string }>(
        "/tickets/upload",
        form,
      );
      router.push(`/journeys/confirm/${result.extraction_id}`);
    } catch (e) {
      setError(
        formatErrorMessage(
          e,
          "The ticket could not be read clearly. You can try uploading a clearer file or enter your journey manually.",
        ),
      );
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div>
      <Link
        href="/journeys/new"
        className="inline-flex items-center gap-2 text-xs mb-6 text-[var(--rail-text-muted)]"
      >
        <ArrowLeft size={15} /> Journey options
      </Link>
      <div className="rb-route-title">
        <span className="rb-eyebrow">YOUR TICKET TO TOGETHERNESS</span>
        <h1>
          Bring your ticket.
          <br />
          <em>We’ll find your journey.</em>
        </h1>
        <p>
          Upload your e-ticket, review the extracted details and join the
          community on your route. Your document is processed privately on the
          server.
        </p>
      </div>
      <div className="grid lg:grid-cols-[1.3fr_.7fr] gap-7">
        <div>
          <section
            className={`rb-ui-card p-8 sm:p-14 text-center border-dashed border-2 ${dragging ? "border-[#24483f] bg-[#e9eddf]" : ""}`}
            aria-label="Upload a ticket"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void submit(e.dataTransfer.files[0]);
            }}
          >
            <span className="rb-empty-icon">
              <Upload size={29} strokeWidth={1.3} />
            </span>
            <h2 className="font-display text-3xl font-normal mt-5">
              A new chapter starts here.
            </h2>
            <p className="text-sm text-[var(--rail-text-muted)] my-5">
              Drop your ticket here, or choose a file.
              <br />
              PDF, PNG or JPEG. Up to 8 MB.
            </p>
            <input
              ref={input}
              type="file"
              id="ticket-upload"
              accept="application/pdf,image/png,image/jpeg"
              className="sr-only"
              disabled={busy}
              onChange={(e) => void submit(e.target.files?.[0])}
              aria-describedby="ticket-upload-status"
            />
            <button
              className="rb-button"
              type="button"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              {busy ? "Reading your ticket…" : "Choose a ticket"}
              <ArrowUpRight size={17} />
            </button>
            <p
              id="ticket-upload-status"
              role="status"
              className="text-xs text-[var(--rail-text-muted)] mt-5"
            >
              {busy
                ? "Reading train details. This may take up to 20 seconds."
                : file
                  ? file.name
                  : "Your ticket is not shown to other travellers."}
            </p>
          </section>
          {error && (
            <ErrorBanner
              message={error}
              onDismiss={() => setError("")}
              className="mt-5"
            />
          )}
          <div className="flex gap-3 text-xs text-[var(--rail-text-muted)] leading-relaxed p-5 mt-3">
            <ShieldCheck size={20} />
            <p>
              Your uploaded ticket is encrypted and deleted after confirmation.
              Abandoned uploads are removed by the retention job. PNRs are
              hashed, and ticket details stay private.
            </p>
          </div>
          <Link
            href="/journeys/new/manual"
            className="inline-flex items-center gap-3 text-xs text-[#a34e2f] mt-3"
          >
            Prefer to enter your train details? <ArrowUpRight size={16} />
          </Link>
        </div>
        <aside className="rb-ui-card overflow-hidden">
          <div className="relative h-56">
            <Image
              src="/images/hero_train_window.webp"
              alt=""
              fill
              sizes="(max-width:1024px) 90vw, 30vw"
              className="object-cover"
            />
          </div>
          <div className="p-7">
            <span className="rb-eyebrow">BEFORE YOU COME ABOARD</span>
            <h2 className="font-display text-2xl font-normal my-4">
              A little care, a better journey.
            </h2>
            <ol className="space-y-5 text-xs text-[var(--rail-text-muted)] list-decimal pl-4">
              <li>Use a clear copy of your own ticket.</li>
              <li>Check the train, date and stations after extraction.</li>
              <li>Choose what you share with your fellow travellers.</li>
            </ol>
            <p className="text-xs text-[var(--rail-text-muted)] mt-6 pt-5 border-t border-[var(--rail-border)]">
              Ticket extraction is not verification by Indian Railways.
              Membership is based on the journey details you provide.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
