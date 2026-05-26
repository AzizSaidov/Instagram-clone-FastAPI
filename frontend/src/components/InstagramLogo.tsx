export function InstagramLogo() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative h-14 w-14 rounded-2xl bg-[linear-gradient(45deg,#F58529,#DD2A7B,#8134AF,#515BD4)] shadow-[0_0_32px_rgba(221,42,123,0.25)]"
        aria-hidden="true"
      >
        <span className="absolute inset-[13px] rounded-xl border-2 border-white" />
        <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
        <span className="absolute right-[17px] top-[17px] h-2 w-2 rounded-full bg-white" />
      </div>
      <div className="ig-wordmark text-[42px] leading-none text-ig-text">
        Instagram
      </div>
    </div>
  )
}
