import React, { useState, useRef, useEffect } from 'react'
import { generateGridData, type ScaleType } from '../utils/musicEngine'

// --- Constants & Types ---

const MINOR_MODES: ScaleType[] = ['Harmonic Minor', 'Melodic Minor', 'Natural Minor']

const KEY_OPTIONS = [
  { major: 'C', minor: 'C' },
  { major: 'Db', minor: 'C#' },
  { major: 'D', minor: 'D' },
  { major: 'Eb', minor: 'Eb' },
  { major: 'E', minor: 'E' },
  { major: 'F', minor: 'F' },
  { major: 'Gb', minor: 'F#' },
  { major: 'G', minor: 'G' },
  { major: 'Ab', minor: 'G#' },
  { major: 'A', minor: 'A' },
  { major: 'Bb', minor: 'Bb' },
  { major: 'B', minor: 'B' },
]

// --- Hooks ---

const useClickOutside = (ref: React.RefObject<HTMLElement | null>, callback: () => void, isActive: boolean) => {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!isActive) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callbackRef.current()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ref, isActive])
}

// --- Sub-Components ---

const KeySelector = ({
  currentKey,
  currentMode,
  preferredMinorMode,
  onSelectKey
}: {
  currentKey: string
  currentMode: ScaleType
  preferredMinorMode: ScaleType
  onSelectKey: (key: string, mode: ScaleType) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setIsOpen(false), isOpen)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-3 text-3xl font-bold text-stone-800 hover:text-stone-600 transition-colors focus:outline-none"
      >
        <span>{currentKey} {currentMode}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-5 h-5 text-stone-300 group-hover:text-stone-400 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      <div
        className={`absolute top-full left-0 mt-2 z-50 transition-all duration-200 ease-out origin-top-left ${
          isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden w-[280px] max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 p-2 gap-1">
            {KEY_OPTIONS.map(({ major, minor }) => (
              <React.Fragment key={major}>
                <button
                  onClick={() => { onSelectKey(major, 'Major'); setIsOpen(false) }}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                    currentKey === major && currentMode === 'Major'
                      ? 'bg-stone-100 text-stone-900 font-semibold'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  {major} Major
                </button>
                <button
                  onClick={() => { onSelectKey(minor, preferredMinorMode); setIsOpen(false) }}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                    currentKey === minor && currentMode !== 'Major'
                      ? 'bg-stone-100 text-stone-900 font-semibold'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  {minor} Minor
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const ModeSelector = ({
  preferredMinorMode,
  onSelectMode
}: {
  preferredMinorMode: ScaleType
  onSelectMode: (mode: ScaleType) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setIsOpen(false), isOpen)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-sm font-medium text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-100 whitespace-nowrap"
      >
        <span>{preferredMinorMode}</span>
        <svg
          className={`w-4 h-4 text-stone-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <div
        className={`absolute top-full right-0 mt-2 w-48 z-50 transition-all duration-200 ease-out origin-top-right ${
          isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        } sm:right-0 sm:origin-top-right left-0 origin-top-left sm:left-auto`}
      >
        <div className="bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden">
          <div className="p-1">
            {MINOR_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => { onSelectMode(mode); setIsOpen(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                  preferredMinorMode === mode
                    ? 'bg-stone-100 text-stone-900 font-semibold'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const StaticRow = ({
  rowType,
  data,
  onClickChord,
  animKey
}: {
  rowType: 'name' | 'roman' | 'mode'
  data: readonly string[]
  onClickChord: (index: number) => void
  animKey: string
}) => {
  // Styles based on row type
  let fontClass = "font-medium"
  let textClass = "text-sm md:text-base"
  
  if (rowType === 'name') {
    fontClass = "font-bold"
  } else if (rowType === 'mode') {
    textClass = "text-[10px]"
  }

  // Row index for animation delay calculation (Name=0, Roman=1, Mode=2)
  const rowIndex = rowType === 'name' ? 0 : rowType === 'roman' ? 1 : 2

  return (
    <>
      <div /> {/* Ghost Column */}
      {data.map((content, colIndex) => {
        const delay = (rowIndex + colIndex) * 35
        return (
          <button
            key={`${rowType}-${colIndex}`}
            onClick={() => onClickChord(colIndex)}
            className={`aspect-square flex items-center justify-center rounded-lg border border-stone-200 bg-white hover:bg-stone-50 active:bg-stone-100 transition-colors shadow-sm text-stone-800 p-1 break-words leading-tight select-none ${fontClass} ${textClass}`}
          >
            <span
              key={`${animKey}-${colIndex}`}
              style={{
                animation: 'rippleFadeIn 0.4s cubic-bezier(0.2, 0, 0.2, 1) backwards',
                animationDelay: `${delay}ms`,
                display: 'inline-block'
              }}
            >
              {content}
            </span>
          </button>
        )
      })}
    </>
  )
}

const ControlsRow = ({
  isOpen,
  onToggle,
  onClickChord
}: {
  isOpen: boolean
  onToggle: () => void
  onClickChord: (index: number) => void
}) => {
  return (
    <>
      <button
        onClick={onToggle}
        className="aspect-square flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600"
        aria-label={isOpen ? "Collapse note grid" : "Expand note grid"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          )}
        </svg>
      </button>

      {Array.from({ length: 7 }).map((_, colIndex) => {
        const num = colIndex + 1
        const isAccent = num % 2 !== 0
        return (
          <button
            key={`control-${colIndex}`}
            onClick={() => onClickChord(colIndex)}
            className={`aspect-square flex items-center justify-center font-bold text-xl rounded-lg hover:bg-stone-100 transition-colors select-none ${isAccent ? 'text-blue-600' : 'text-stone-800'}`}
          >
            {num}
          </button>
        )
      })}
    </>
  )
}

const NoteGrid = ({
  rows,
  animKey,
  isVisible
}: {
  rows: string[][]
  animKey: string
  isVisible: boolean
}) => {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div className="grid grid-cols-8 gap-3 pt-3">
          {Array.from({ length: 7 }).map((_, rowIndex) => {
            const rowNum = rowIndex + 1
            const isAccent = rowNum % 2 !== 0
            const baseDelay = rowIndex * 30
            // Note: Rows are rendered top-to-bottom, accessing data reversed (7 down to 1) 
            // to match the stacking concept (Root at top of this visual section? No, checked logic: rows[6] is 1st degree)
            // gridData.rows is [7th, 6th... 1st].
            // We want visual top row to be 1st degree (rows[6]).
            const rowData = rows[6 - rowIndex]

            return (
              <React.Fragment key={`note-row-${rowNum}`}>
                {/* Row Number */}
                <div
                  className={`aspect-square flex items-center justify-center font-bold text-xl rounded-lg ${isAccent ? 'text-blue-600' : 'text-stone-800'} transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  }`}
                  style={{ transitionDelay: isVisible ? `${baseDelay}ms` : '0ms' }}
                >
                  {rowNum}
                </div>

                {/* Note Cells */}
                {rowData.map((note, colIndex) => {
                  const delay = baseDelay + colIndex * 30
                  return (
                    <div
                      key={`note-${rowIndex}-${colIndex}`}
                      className={`aspect-square flex items-center justify-center rounded-lg border border-stone-200 bg-white shadow-sm font-medium select-none ${isAccent ? 'text-blue-600' : 'text-stone-800'} transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                      }`}
                      style={{ transitionDelay: isVisible ? `${delay}ms` : '0ms' }}
                    >
                      <span
                        key={`${animKey}-${rowIndex}-${colIndex}`}
                        style={{
                          animation: 'rippleFadeIn 0.4s cubic-bezier(0.2, 0, 0.2, 1) backwards',
                          animationDelay: `${delay}ms`,
                          display: 'inline-block'
                        }}
                      >
                        {note}
                      </span>
                    </div>
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// --- Main Component ---

export const ChordGrid = () => {
  const [currentKey, setCurrentKey] = useState('C')
  const [currentMode, setCurrentMode] = useState<ScaleType>('Major')
  const [preferredMinorMode, setPreferredMinorMode] = useState<ScaleType>('Harmonic Minor')
  const [isNoteGridOpen, setNoteGridOpen] = useState(false)

  const gridData = generateGridData(currentKey, currentMode)
  
  // Animation key triggers re-render of span animations when key/mode changes
  const animKey = `${currentKey}-${currentMode}`

  const handleChordClick = (colIndex: number) => {
    // 1. Identify new Root (row 6 is the 1st degree/scale root)
    const newRoot = gridData.rows[6][colIndex]

    // 2. Identify Mode (Major/Minor)
    const chordName = gridData.chordNames[colIndex]
    const suffix = chordName.slice(newRoot.length)
    const isMinor = suffix.startsWith('m') || suffix.startsWith('dim')

    // 3. Update State
    setCurrentKey(newRoot)
    if (isMinor) {
      setCurrentMode(preferredMinorMode)
    } else {
      setCurrentMode('Major')
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <style>{`
        @keyframes rippleFadeIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <KeySelector 
          currentKey={currentKey} 
          currentMode={currentMode}
          preferredMinorMode={preferredMinorMode}
          onSelectKey={(key, mode) => {
            setCurrentKey(key)
            setCurrentMode(mode)
          }}
        />
        
        <ModeSelector 
          preferredMinorMode={preferredMinorMode}
          onSelectMode={(mode) => {
            if (currentMode !== 'Major') setCurrentMode(mode)
            setPreferredMinorMode(mode)
          }}
        />
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[624px]">
          
          {/* Static Section (Chord Info & Controls) */}
          <div className="grid grid-cols-8 gap-3">
            <StaticRow rowType="name" data={gridData.chordNames} onClickChord={handleChordClick} animKey={animKey} />
            <StaticRow rowType="roman" data={gridData.romanNumerals} onClickChord={handleChordClick} animKey={animKey} />
            <StaticRow rowType="mode" data={gridData.modes} onClickChord={handleChordClick} animKey={animKey} />
            <ControlsRow 
              isOpen={isNoteGridOpen} 
              onToggle={() => setNoteGridOpen(!isNoteGridOpen)} 
              onClickChord={handleChordClick} 
            />
          </div>

          {/* Collapsible Section (Notes) */}
          <NoteGrid 
            rows={gridData.rows} 
            isVisible={isNoteGridOpen} 
            animKey={animKey} 
          />
          
        </div>
      </div>
    </div>
  )
}
