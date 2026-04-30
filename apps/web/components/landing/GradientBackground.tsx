export default function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#16213e] to-[#1a1f3a]" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-3xl animate-pulse" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-600/20 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full"
          style={{
            backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.2) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>
    </div>
  );
}
