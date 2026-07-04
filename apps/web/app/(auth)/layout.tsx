export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fbfaf7] text-[#0f2433]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(47,127,115,0.10),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(129,160,181,0.16),transparent_30%),radial-gradient(circle_at_80%_90%,rgba(47,127,115,0.08),transparent_25%)]" />
      <div className="relative min-h-screen">{children}</div>
    </div>
  )
}
