export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="relative w-80 -rotate-1 rounded-sm border-5 border-black/25 bg-[#fff4dc] p-8">
        <div className="absolute -top-5 left-1/2 h-12 w-32 -translate-x-1/2 rotate-[-5deg] border-5 border-black/12 bg-[#e3d77d]/80" />

        <div className="flex flex-col items-center gap-6 pt-8">
          <div className="mt-5 flex items-end gap-2">
            <div className="h-4 w-4 animate-pulse rounded-full bg-black" />
            <div className="h-4 w-4 animate-pulse rounded-full bg-black [animation-delay:150ms]" />
            <div className="h-4 w-4 animate-pulse rounded-full bg-black [animation-delay:300ms]" />
          </div>

          <p className="font-shadows text-2xl font-bold">Carregando...</p>
        </div>
      </div>
    </div>
  );
}
