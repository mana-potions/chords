import { useNavigate } from 'react-router-dom'

export const HomePage = () => {
  const navigate = useNavigate()

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 md:py-32">
      <header className="mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-stone-900 mb-6">
          Key to <br className="hidden md:block" />
          <span className="italic font-serif">Keys</span>
        </h1>
        <div className="w-16 h-1 bg-stone-300 mb-8 mx-auto md:mx-0 rounded-full"></div>
      </header>

      <div className="space-y-6 text-lg text-stone-600 leading-relaxed max-w-2xl text-center md:text-left">
        <p>
          Let's play a game of chords. 
        </p>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
        <button 
          onClick={() => navigate('/tonic-target')}
          className="px-8 py-3 bg-stone-800 text-stone-50 rounded-full hover:bg-stone-700 transition-colors duration-300 font-medium"
        >
            Tonic Target Practice
        </button>
        <button 
          onClick={() => navigate('/chord-grid')}
          className="px-8 py-3 border border-stone-300 text-stone-700 rounded-full hover:bg-stone-100 transition-colors duration-300 font-medium"
        >
            View Chord Grid
        </button>
      </div>
    </div>
  )
}