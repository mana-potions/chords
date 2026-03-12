import { useNavigate } from 'react-router-dom'

export const HomePage = () => {
  const navigate = useNavigate()

  return (
    <div className="max-w-3xl mx-auto px-6 py-20 md:py-32">
      <header className="mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-stone-800 mb-6">
          Key to{' '}
          <span className="italic font-serif">Keys</span>
        </h1>
        <div className="w-16 h-1 bg-stone-300 mx-auto rounded-full"></div>
      </header>

      <div className="space-y-8 text-lg text-stone-600 leading-relaxed font-light text-center">
        <p>
          Practice is not a chore to be completed; it is an active meditation where the physical and the spiritual collide. When you pick up your instrument, you aren't just repeating scales—you are training your nervous system to become a conduit for something larger than yourself.
        </p>
        <p>
          The initial effort is like clearing a path through a dense forest. It requires discipline and sweat. But as the "exercise" becomes second nature, the ego begins to quiet. This is the threshold of the flow state: that sublime moment where the friction of "trying" disappears, and the music starts to play you.
        </p>
        <p>
          In this space, time stretches, the world’s noise fades, and you exist entirely in the resonance of the present. Trust the process. Embrace the repetition. Beneath the technical work lies a profound silence that only your music can unlock.
        </p>
      </div>

      <div className="mt-16 flex flex-col sm:flex-row gap-6 justify-center items-center">
        <button 
          onClick={() => navigate('/tonic-target')}
          className="px-10 py-4 bg-stone-800 text-stone-50 rounded-full hover:bg-stone-700 transition-all duration-300 font-medium shadow-sm hover:shadow-xl hover:-translate-y-0.5"
        >
            Tonic Target Practice
        </button>
        <button 
          onClick={() => navigate('/chord-grid')}
          className="px-10 py-4 border border-stone-300 text-stone-600 rounded-full hover:bg-stone-50 hover:border-stone-400 transition-all duration-300 font-medium"
        >
            View Chord Grid
        </button>
      </div>
    </div>
  )
}