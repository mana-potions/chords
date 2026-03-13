import { useNavigate } from 'react-router-dom'

export const TonicTargetPractice = () => {
  const navigate = useNavigate()

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-stone-900 mb-4">
          Tonic Target <span className="font-serif italic">Practice</span>
        </h1>
        <div className="w-16 h-1 bg-stone-300 rounded-full"></div>
      </header>
      
      <div className="p-8 md:p-12 bg-white rounded-2xl border border-stone-100 shadow-sm space-y-12">
        {/* Intro */}
        <div className="max-w-3xl">
          <p className="text-lg text-stone-600 leading-relaxed font-light">
            Think of Tonal Target Practice as a meditative exercise in musical presence. Rather than a drill, it is a way to align your hearing with the natural pull of a key, turning ear training into a focused, calm flow state.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* The Flow */}
          <section>
            <h2 className="text-2xl font-serif italic text-stone-800 mb-4">The Flow</h2>
            <p className="text-stone-600 leading-relaxed">
              The game is a structured movement through the major scale. Instead of viewing the scale as a static ladder, you treat each note (from the I to the vii∘) as a destination. You navigate to each one using the most classic "pathway" in music: the ii−V−I progression.
            </p>
          </section>

          {/* Why It Works */}
          <section>
            <h2 className="text-2xl font-serif italic text-stone-800 mb-4">Why It Works</h2>
            <p className="text-stone-600 leading-relaxed">
              This method moves beyond simple ear training and into harmonic fluency. By constantly re-centering yourself through these progressions, you learn to see every note in a key not just as a point on a map, but as a potential home base. It turns the entire keyboard into a fluid, interconnected space where you are never truly lost.
            </p>
          </section>
        </div>

        {/* The Practice */}
        <section>
          <h2 className="text-2xl font-serif italic text-stone-800 mb-6">The Practice</h2>
          <p className="text-stone-600 mb-6">The game usually follows a simple but addictive loop:</p>
          <ul className="space-y-6">
            <li className="flex gap-4">
              <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 font-serif italic border border-stone-200 text-sm">1</span>
              <div>
                <strong className="text-stone-800 block mb-1">The Destination:</strong>
                <p className="text-stone-600 leading-relaxed">You pick a "Target" scale degree (for example, the ii or the IV).</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 font-serif italic border border-stone-200 text-sm">2</span>
              <div>
                <strong className="text-stone-800 block mb-1">The Approach:</strong>
                <p className="text-stone-600 leading-relaxed">You play a ii−V−I progression that is functionally transposed to resolve specifically to that target note.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600 font-serif italic border border-stone-200 text-sm">3</span>
              <div>
                <strong className="text-stone-800 block mb-1">The Arrival:</strong>
                <p className="text-stone-600 leading-relaxed">By the time you hit the "I" of your sequence, you have successfully "landed" on the target degree of the original key, feeling its unique tension and color within the larger landscape.</p>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-16 flex justify-center">
        <button
          onClick={() => navigate('/tonic-target-game')}
          className="px-10 py-4 bg-stone-800 text-stone-50 text-lg rounded-full hover:bg-stone-700 transition-all duration-300 font-medium shadow-sm hover:shadow-xl hover:-translate-y-0.5"
        >
          Begin Playing
        </button>
      </div>
    </div>
  )
}
