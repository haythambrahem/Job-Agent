export default function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden bg-white">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-100/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
    </div>
  );
}
