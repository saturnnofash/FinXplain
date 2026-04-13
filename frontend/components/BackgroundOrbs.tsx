export default function BackgroundOrbs() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0d2444] to-[#071a35]" />

      {/* Blue orb — top left */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(55,138,221,0.4) 0%, transparent 70%)",
        }}
      />

      {/* Teal orb — center right */}
      <div
        className="absolute top-1/3 -right-24 w-[400px] h-[400px] rounded-full opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(93,202,165,0.4) 0%, transparent 70%)",
        }}
      />

      {/* Purple orb — bottom left */}
      <div
        className="absolute -bottom-20 left-1/4 w-[450px] h-[450px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
