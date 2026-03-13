import React, { useState, useRef, useEffect, useCallback } from 'react'
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

const PICKER_ITEMS = KEY_OPTIONS.map(k => k.major)

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

const HorizontalPicker = ({
  items,
  selectedItem,
  onSelectItem
}: {
  items: string[]
  selectedItem: string
  onSelectItem: (item: string) => void
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(5)
  
  // Drag & Animation State
  const [dragOffset, setDragOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const initialX = useRef(0)
  const hasMoved = useRef(false)

  useEffect(() => {
    const updateVisibility = () => {
      if (!containerRef.current) return
      const width = containerRef.current.offsetWidth
      // Calculate how many items fit comfortably.
      // Fill the space, adjusting density (80px per item)
      let count = Math.floor(width / 80)
      // Ensure odd number to have a perfect center
      if (count % 2 === 0) count -= 1
      // Constraints: Min 3
      if (count < 3) count = 3
      
      setVisibleCount(count)
    }

    // Initial check
    updateVisibility()

    const observer = new ResizeObserver(updateVisibility)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Derived dimensions
  // We assume the container width is available or default to a safe non-zero value to prevent division by zero
  // If containerRef is null initially, this might be 0, but effect updates it.
  const containerWidth = containerRef.current?.offsetWidth || 0
  const itemWidth = visibleCount > 0 ? containerWidth / visibleCount : 0

  // Navigation helper
  const handleNavigate = (direction: number) => {
    const currentIndex = items.indexOf(selectedItem)
    if (currentIndex === -1) return
    const nextIndex = ((currentIndex + direction) % items.length + items.length) % items.length
    onSelectItem(items[nextIndex])
  }

  // Pointer Events (Mouse + Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsAnimating(false)
    isDragging.current = true
    hasMoved.current = false
    initialX.current = e.clientX
    startX.current = e.clientX - dragOffset
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    
    if (Math.abs(e.clientX - initialX.current) > 5) {
      hasMoved.current = true
    }

    const newOffset = e.clientX - startX.current
    setDragOffset(newOffset)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

    if (itemWidth === 0) return

    // If it was just a tap, let the click handler take over
    if (!hasMoved.current) {
      setDragOffset(0)
      return
    }

    // Calculate which item we landed closest to
    // Dragging left (negative offset) means we want to see items to the right (positive index increment)
    const movedItems = -Math.round(dragOffset / itemWidth)
    const targetOffset = -movedItems * itemWidth

    // Animate to snap position
    setIsAnimating(true)
    setDragOffset(targetOffset)

    // After animation, actually update the selection and reset offset
    setTimeout(() => {
      setIsAnimating(false)
      setDragOffset(0)
      if (movedItems !== 0) {
        handleNavigate(movedItems)
      }
    }, 200) // matches transition duration
  }

  const handleItemClick = (offset: number) => {
    if (hasMoved.current) return

    const targetOffset = -offset * itemWidth
    
    setIsAnimating(true)
    setDragOffset(targetOffset)
    
    setTimeout(() => {
      setIsAnimating(false)
      setDragOffset(0)
      handleNavigate(offset)
    }, 200)
  }

  // --- Rendering Logic ---

  if (items.length === 0) return null

  // Determine the window of items to show based on selectedItem
  // We normalize to finding the major key equivalent if needed, though parent passes controlled value
  let centerIndex = items.indexOf(selectedItem)
  if (centerIndex === -1) centerIndex = 0 // Fallback

  // Calculate dynamic buffer to ensure loop continuity during drag
  // This ensures items keep rendering even if dragged far beyond the initial view
  const dragBuffer = itemWidth > 0 ? Math.ceil(Math.abs(dragOffset) / itemWidth) : 0
  const buffer = 3 + dragBuffer 
  const half = Math.floor((visibleCount - 1) / 2) + buffer
  const visibleItems = []

  for (let i = -half; i <= half; i++) {
    // Handle wrapping (circular list)
    let index = (centerIndex + i) % items.length
    if (index < 0) index += items.length

    visibleItems.push({
      item: items[index],
      offset: i,
      // Unique key combining value and relative position to ensure proper React reconciliation during slide
      key: `${items[index]}-${i}` 
    })
  }

  return (
    <div 
      ref={containerRef} 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative w-full flex justify-center items-center overflow-hidden py-8 select-none rounded-xl cursor-grab active:cursor-grabbing touch-none"
    >
      {/* Gradient Masks for fading edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-stone-50 via-stone-50/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-stone-50 via-stone-50/80 to-transparent z-10 pointer-events-none" />
      
      {/* Bottom Shadow (Subtle) */}
      <div className="absolute left-0 right-0 bottom-0 h-4 bg-gradient-to-t from-stone-200/20 to-transparent pointer-events-none z-10" />

      {visibleItems.map(({ item, offset, key }) => {
        // Calculate dynamic visual state based on drag
        // The item's center position relative to the viewport center (0)
        // position = (offset * itemWidth) + dragOffset
        const position = (offset * itemWidth) + dragOffset
        
        // Distance from center in pixels
        const distance = Math.abs(position)
        
        // Normalize distance in items
        const normalizedDistance = itemWidth > 0 ? distance / itemWidth : 0
        
        // Scale: 1.1 at center, drops to 0.8 min
        const scale = Math.max(1.1 - (normalizedDistance * 0.1), 0.8)
        
        // Opacity: 1.0 at center, fades out slowly
        const opacity = Math.max(1 - (normalizedDistance * 0.15), 0.2)
        
        // Font weight visual trick: interpolate roughly
        const isCenterVisual = normalizedDistance < 0.5

        return (
          <button
            key={key}
            onClick={() => handleItemClick(offset)}
            className={`
              absolute flex items-center justify-center transition-transform ease-out
              ${isCenterVisual
                ? 'text-4xl font-extrabold text-stone-800 scale-110 z-20 drop-shadow-md' 
                : 'text-xl font-medium text-stone-400 hover:text-stone-600 scale-90 cursor-pointer drop-shadow-sm'
              }
            `}
            style={{
              width: `${itemWidth}px`,
              // We use transform to position items relative to center
              transform: `translateX(${position}px) scale(${scale})`,
              opacity: opacity,
              transition: isAnimating ? 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms' : 'none',
              textShadow: isCenterVisual ? '0 0 30px rgba(168, 162, 158, 0.8)' : undefined
            }}
            aria-label={`Select key ${item}`}
            aria-current={offset === 0 ? 'true' : undefined}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

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

  // Helper to get the current key in Major representation for the picker (e.g. if key is C# minor, picker needs Db)
  const currentPickerKey = KEY_OPTIONS.find(k => k.major === currentKey || k.minor === currentKey)?.major || 'C'

  const handlePickerSelect = (key: string) => {
    // Check if we need to switch to minor equivalent
    if (currentMode !== 'Major') {
      const option = KEY_OPTIONS.find(o => o.major === key)
      if (option) {
        setCurrentKey(option.minor)
      } else {
        setCurrentKey(key)
      }
    } else {
      setCurrentKey(key)
    }
  }

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
      <div className="flex flex-col gap-8 mb-8">
        <HorizontalPicker 
          items={PICKER_ITEMS} 
          selectedItem={currentPickerKey} 
          onSelectItem={handlePickerSelect} 
        />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
