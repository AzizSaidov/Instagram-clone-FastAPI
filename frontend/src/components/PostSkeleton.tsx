export function PostSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[560px] space-y-3 border-b border-ig-border pb-5">
      <div className="flex h-14 items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-ig-elevated" />
        <div className="h-3 w-32 rounded bg-ig-elevated" />
      </div>
      <div className="aspect-square rounded-sm bg-ig-elevated" />
      <div className="h-4 w-40 rounded bg-ig-elevated" />
      <div className="h-3 w-56 rounded bg-ig-elevated" />
    </div>
  )
}
