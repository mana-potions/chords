export const TonicTargetPractice = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-green-900 mb-4">
          Tonic Target <span className="font-serif italic">Practice</span>
        </h1>
        <div className="w-16 h-1 bg-green-300 rounded-full"></div>
      </header>
      
      <div className="p-8 bg-white/40 backdrop-blur-sm rounded-2xl border border-green-100 shadow-sm">
        <p className="text-lg text-green-800">
          Listen carefully. Find the home note.
        </p>
        {/* Game logic will go here */}
      </div>
    </div>
  )
}