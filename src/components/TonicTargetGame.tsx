import React, { useState, useRef } from 'react'
import { KEY_OPTIONS } from '../utils/musicEngine'
import { PianoKeyboard } from './PianoKeyboard'
import { useClickOutside } from '../hooks/useClickOutside'

const ProgressionSelector = ({
  value,
  onChange
}: {
  value: string
  onChange: (val: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setIsOpen(false), isOpen)

  const options = ['ii-V-I']

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-3 text-3xl font-bold text-stone-800 hover:text-stone-600 transition-colors focus:outline-none"
      >
        <span>{value}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
          className={`w-5 h-5 text-stone-300 group-hover:text-stone-400 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 transition-all duration-200 ease-out origin-top ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}>
        <div className="bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden w-[200px] flex flex-col p-1">
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setIsOpen(false) }} className="text-center px-3 py-3 rounded-lg text-lg font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const MinorModeSelector = ({
  value,
  onChange
}: {
  value: string
  onChange: (val: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setIsOpen(false), isOpen)

  const options = ['Harmonic', 'Natural', 'Melodic']

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-sm font-medium text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-100 whitespace-nowrap"
      >
        <span>{value}</span>
        <svg className={`w-4 h-4 text-stone-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <div className={`absolute top-full right-0 mt-2 w-48 z-50 transition-all duration-200 ease-out origin-top-right ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}>
        <div className="bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden p-1">
          {options.map((mode) => (
            <button key={mode} onClick={() => { onChange(mode); setIsOpen(false) }} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${value === mode ? 'bg-stone-100 text-stone-900 font-semibold' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}>
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export const TonicTargetGame = () => {
  const [progression, setProgression] = useState('ii-V-I')
  const [minorMode, setMinorMode] = useState('Harmonic')

  const [currentChord] = useState<{ root: string, type: string } | null>(() => {
    // Generate a random chord on mount
    const randomKey = KEY_OPTIONS[Math.floor(Math.random() * KEY_OPTIONS.length)]
    const isMinor = Math.random() > 0.5
    return {
      root: isMinor ? randomKey.minor : randomKey.major,
      type: isMinor ? 'Minor' : 'Major'
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 overflow-hidden">
      {/* Top Controls */}
      <div className="w-full p-6 flex items-start justify-between relative z-20">
        <div className="flex-1"></div>
        <div className="flex-1 flex justify-center">
          <ProgressionSelector value={progression} onChange={setProgression} />
        </div>
        <div className="flex-1 flex justify-end">
          <MinorModeSelector value={minorMode} onChange={setMinorMode} />
        </div>
      </div>

      {/* Center Content: Random Chord */}
      <div className="flex-grow flex items-center justify-center p-6">
        {currentChord && (
          <div className="text-center animate-in fade-in zoom-in duration-700">
            <h1 className="text-9xl font-bold text-stone-800 tracking-tighter drop-shadow-sm">
              {currentChord.root}
            </h1>
            <p className="text-5xl font-serif italic text-stone-500 mt-4">
              {currentChord.type}
            </p>
          </div>
        )}
      </div>

      {/* Bottom: Piano Keyboard */}
      <div className="w-full">
        <PianoKeyboard 
          highlightedNotes={[]} 
          className="w-full h-auto block"
        />
      </div>
    </div>
  )
}
