import React, { useState, useRef, useEffect } from 'react'
import { generateGridData, type ScaleType } from '../utils/musicEngine'

export const ChordGrid = () => {
  const [currentKey, setCurrentKey] = useState('C')
  const [currentMode, setCurrentMode] = useState<ScaleType>('Major')
  const [preferredMinorMode, setPreferredMinorMode] = useState<ScaleType>('Harmonic Minor')
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const [isNoteGridOpen, setNoteGridOpen] = useState(false)
  const [isTitleOpen, setTitleOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  const gridData = generateGridData(currentKey, currentMode)
  const minorModes: ScaleType[] = ['Harmonic Minor', 'Melodic Minor', 'Natural Minor']

  const handleChordClick = (colIndex: number) => {
    // 1. Identify the new Root from the bottom of the note stack (row index 6 corresponds to the scale root)
    const newRoot = gridData.rows[6][colIndex]

    // 2. Identify if the target chord is Minor or Major
    const chordName = gridData.chordNames[colIndex]
    // Remove the root from the name to check the suffix (e.g. "C#m7" -> "m7")
    // We use the known root string length to slice safely
    const suffix = chordName.slice(newRoot.length)
    
    // Simple heuristic: if suffix starts with 'm' (and not 'Maj' which starts with 'M'), it's minor.
    // Also treating 'dim' (diminished) as minor-ish for the sake of mode switching.
    const isMinor = suffix.startsWith('m') || suffix.startsWith('dim')

    // 3. Update State
    setCurrentKey(newRoot)
    if (isMinor) {
      setCurrentMode(preferredMinorMode)
    } else {
      setCurrentMode('Major')
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
      if (titleRef.current && !titleRef.current.contains(event.target as Node)) {
        setTitleOpen(false)
      }
    }

    if (isDropdownOpen || isTitleOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen, isTitleOpen])

  const keyOptions = [
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

  const handleKeySelect = (key: string, mode: ScaleType) => {
    setCurrentKey(key)
    setCurrentMode(mode)
    setTitleOpen(false)
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <style>{`
        @keyframes rippleFadeIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        {/* --- Title / Key Selector --- */}
        <div className="relative" ref={titleRef}>
          <button
            onClick={() => setTitleOpen(!isTitleOpen)}
            className="group flex items-center gap-3 text-3xl font-bold text-stone-800 hover:text-stone-600 transition-colors focus:outline-none"
          >
            <span>{currentKey} {currentMode}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-5 h-5 text-stone-300 group-hover:text-stone-400 transition-all duration-200 ${isTitleOpen ? 'rotate-180' : ''}`}
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          <div
            className={`absolute top-full left-0 mt-2 z-50 transition-all duration-200 ease-out origin-top-left ${
              isTitleOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
            }`}
          >
            <div className="bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden w-[280px] max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 p-2 gap-1">
                {keyOptions.map(({ major, minor }) => (
                  <React.Fragment key={major}>
                    <button
                      onClick={() => handleKeySelect(major, 'Major')}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                        currentKey === major && currentMode === 'Major'
                          ? 'bg-stone-100 text-stone-900 font-semibold'
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                      }`}
                    >
                      {major} Major
                    </button>
                    <button
                      onClick={() => handleKeySelect(minor, preferredMinorMode)}
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
        
        {/* --- Mode Selector Dropdown --- */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-sm font-medium text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-100 whitespace-nowrap"
          >
            <span>{preferredMinorMode}</span>
            <svg
              className={`w-4 h-4 text-stone-400 transform transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div
            className={`absolute top-full right-0 mt-2 w-48 z-50 transition-all duration-200 ease-out origin-top-right ${
              isDropdownOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
            } sm:right-0 sm:origin-top-right left-0 origin-top-left sm:left-auto`}
          >
              <div className="bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden">
                <div className="p-1">
                  {minorModes.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        if (currentMode !== 'Major') {
                          setCurrentMode(mode)
                        }
                        setPreferredMinorMode(mode)
                        setDropdownOpen(false)
                      }}
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
      </div>

      {/* 
        Using a single grid with 8 columns to maintain alignment between 
        the top 'description' column and the bottom grid.
      */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[624px]">
          {/* --- Static Grid Section --- */}
          <div className="grid grid-cols-8 gap-3">
        
          {/* --- Bottom Section: 4 rows --- */}
          {Array.from({ length: 4 }).map((_, rowIndex) => {
          const rowNum = rowIndex + 1

          return (
            <React.Fragment key={`bottom-row-${rowNum}`}>
              {/* Ghost Column (matches top description column width) */}
              {rowNum === 4 ? (
                <button
                  onClick={() => setNoteGridOpen(!isNoteGridOpen)}
                  className="aspect-square flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600"
                  aria-label={isNoteGridOpen ? "Collapse note grid" : "Expand note grid"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    {isNoteGridOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    )}
                  </svg>
                </button>
              ) : <div />}

              {/* 7 Data Columns */}
              {Array.from({ length: 7 }).map((_, colIndex) => {
                if (rowNum === 4) {
                  const num = colIndex + 1
                  const isAccent = num % 2 !== 0
                  const textColorClass = isAccent ? 'text-blue-600' : 'text-stone-800'
                  return (
                    <button
                      key={`bottom-btn-${rowNum}-${colIndex}`}
                      onClick={() => handleChordClick(colIndex)}
                      className={`aspect-square flex items-center justify-center font-bold text-xl rounded-lg hover:bg-stone-100 transition-colors select-none ${textColorClass}`}
                    >
                      {num}
                    </button>
                  )
                }

                let content = ''
                let styleClass = "aspect-square flex items-center justify-center rounded-lg border border-stone-200 bg-white hover:bg-stone-50 active:bg-stone-100 transition-colors shadow-sm font-medium text-stone-800 p-1 break-words leading-tight select-none"

                if (rowNum === 1) {
                  content = gridData.chordNames[colIndex]
                  styleClass = styleClass.replace("font-medium", "font-bold")
                  styleClass += " text-sm md:text-base"
                } else if (rowNum === 2) {
                  content = gridData.romanNumerals[colIndex]
                  styleClass += " text-sm md:text-base"
                } else if (rowNum === 3) {
                  content = gridData.modes[colIndex]
                  styleClass += " text-[10px]" // Modes names can be long, utilize smaller font
                }

                const delay = (rowIndex + colIndex) * 35

                return (
                  <button 
                    key={`bottom-cell-${rowNum}-${colIndex}`} 
                    onClick={() => handleChordClick(colIndex)}
                    className={styleClass}
                  >
                    <span
                      key={`bottom-content-${rowNum}-${colIndex}-${currentKey}-${currentMode}`}
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
            </React.Fragment>
          )
        })}
          </div>

          {/* --- Collapsible Animated Section --- */}
          <div
            className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isNoteGridOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-8 gap-3 pt-3">
                {/* --- Top Section: Note Number (7 rows) --- */}
                {Array.from({ length: 7 }).map((_, rowIndex) => {
          const rowNum = rowIndex + 1
          // "starting with row 1 as accent, ending with row 7 as accent" -> Odd rows are accented
          const isAccent = rowNum % 2 !== 0
          const textColorClass = isAccent ? 'text-blue-600' : 'text-stone-800'
          const baseDelay = rowIndex * 30

          return (
            <React.Fragment key={`top-row-${rowNum}`}>
              {/* Column 1: Row Description (Row Number) */}
              <div
                className={`aspect-square flex items-center justify-center font-bold text-xl rounded-lg ${textColorClass} transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isNoteGridOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}
                style={{ transitionDelay: isNoteGridOpen ? `${baseDelay}ms` : '0ms' }}
              >
                {rowNum}
              </div>

              {/* Columns 2-8: Data Buttons */}
              {Array.from({ length: 7 }).map((_, colIndex) => {
                const delay = baseDelay + colIndex * 30
                return (
                  <div 
                    key={`top-cell-${rowNum}-${colIndex}`} 
                    className={`aspect-square flex items-center justify-center rounded-lg border border-stone-200 bg-white shadow-sm font-medium select-none ${textColorClass} transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      isNoteGridOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    }`}
                    style={{ transitionDelay: isNoteGridOpen ? `${delay}ms` : '0ms' }}
                  >
                    <span
                      key={`top-content-${rowNum}-${colIndex}-${currentKey}-${currentMode}`}
                      style={{
                        animation: 'rippleFadeIn 0.4s cubic-bezier(0.2, 0, 0.2, 1) backwards',
                        animationDelay: `${delay}ms`,
                        display: 'inline-block'
                      }}
                    >
                      {gridData.rows[6 - rowIndex][colIndex]}
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
        </div>
      </div>
    </div>
  )
}