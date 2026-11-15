import Link from "next/link";
export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="rb-empty-state max-w-lg">
        <span className="rb-eyebrow">404 / A LITTLE OFF THE ROUTE</span>
        <h1 className="rb-screen-heading my-5">This stop isn’t on the map.</h1>
        <p>The page may have moved, or the link may be incomplete.</p>
        <Link className="rb-button" href="/home">
          Back to RailBandhan
        </Link>
      </div>
    </main>
  );
}
