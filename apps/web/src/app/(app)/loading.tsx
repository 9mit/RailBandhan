export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" role="status">
      <span className="sr-only">Loading your journey…</span>
      <div className="h-12 w-2/3 rounded bg-[#e9eddf] animate-pulse" />
      <div className="h-64 rounded-xl bg-[#e9eddf] animate-pulse" />
      <div className="grid grid-cols-2 gap-5">
        <div className="h-40 rounded-xl bg-[#e9eddf] animate-pulse" />
        <div className="h-40 rounded-xl bg-[#e9eddf] animate-pulse" />
      </div>
    </div>
  );
}
