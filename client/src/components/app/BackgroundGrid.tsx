export default function BackgroundGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 min-h-screen opacity-100"
      style={{
        backgroundImage:
          "radial-gradient(rgba(220,199,168,1) 3px, transparent 3px)",
        backgroundSize: "28px 28px",
        backgroundPosition: "center",
      }}
    />
  );
}
