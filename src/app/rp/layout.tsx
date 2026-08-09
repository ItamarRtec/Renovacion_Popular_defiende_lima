export default function RpLayout({ children }: LayoutProps<"/rp">) {
  return (
    <>
      <style>{`
        html { color-scheme: light; }
        body { background: #ffffff !important; color: #0b2a36; }
      `}</style>
      <div className="theme-rp flex min-h-full flex-1 flex-col bg-white text-[#0b2a36]">
        {children}
      </div>
    </>
  );
}
