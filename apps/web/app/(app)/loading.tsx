export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse" />
    </div>
  );
}
