export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <span className="font-display font-light italic text-[1.5rem] text-black animate-pulse">
          EYRA
        </span>
        <div className="w-8 h-8 border-2 border-[#E1E1E1] border-t-black rounded-full animate-spin" />
      </div>
    </div>
  );
}
