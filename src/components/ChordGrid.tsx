import React, { useState, useRef, useEffect } from 'react'
import { generateGridData, type ScaleType, getChordInversions, MINOR_MODES, KEY_OPTIONS, ALL_PICKER_ITEMS, ENHARMONICS } from '../utils/musicEngine'
import { PianoKeyboard } from './PianoKeyboard'
import { useClickOutside } from '../hooks/useClickOutside'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { resolveMidi, extractChordNotes, shiftOctavesDown } from '../utils/chordHelpers'

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
  const [containerWidth, setContainerWidth] = useState(0)
  
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
      setContainerWidth(width)
      // Calculate how many items fit comfortably.
      // Fill the space, adjusting density (80px per item for short names)
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
  const itemWidth = visibleCount > 0 ? containerWidth / visibleCount : 0

  // Navigation helper
  const handleNavigate = (direction: number) => {
    let currentIndex = items.indexOf(selectedItem)
    if (currentIndex === -1) currentIndex = 0
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
      className="relative w-full flex justify-center items-center py-8 select-none rounded-xl cursor-grab active:cursor-grabbing touch-none"
    >
      {/* Gradient Masks for fading edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-stone-50 via-stone-50/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-stone-50 via-stone-50/80 to-transparent z-10 pointer-events-none" />
      
      {/* Bottom Shadow (Subtle) */}
      <div className="absolute left-0 right-0 bottom-0 h-4 bg-gradient-to-t from-stone-200/20 to-transparent pointer-events-none z-10" />

      {containerWidth > 0 && visibleItems.map(({ item, offset, key }) => {
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
        
        // Opacity: 1.0 at center, fades out towards edges
        const relativeDist = containerWidth > 0 ? distance / (containerWidth / 2) : 0
        const opacity = Math.max(1 - (relativeDist * 1.2), 0)
        
        // Font weight visual trick: interpolate roughly
        const isCenterVisual = normalizedDistance < 0.5

        const isMinor = item.endsWith(' Minor')

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
              transform: `translateX(${position}px) scale(${scale}) ${isMinor ? 'translateY(-8%)' : ''}`,
              opacity: opacity,
              transition: isAnimating ? 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms' : 'none',
              textShadow: isCenterVisual ? '0 0 30px rgba(168, 162, 158, 0.8)' : undefined
            }}
            aria-label={`Select key ${item}`}
            aria-current={offset === 0 ? 'true' : undefined}
          >
            {isMinor 
              ? item.replace(' Minor', 'm').toLowerCase() 
              : item.replace(' Major', 'M')}
          </button>
        )
      })}
    </div>
  )
}

const InfoModal = ({
  isOpen,
  onClose,
  chordData,
  onPlayInversion
}: {
  isOpen: boolean
  onClose: () => void
  chordData: { name: string; notes: string[]; inversions: string[][] } | null
  onPlayInversion: (notes: string[]) => void
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [displayData, setDisplayData] = useState(chordData)

  if (isOpen && !shouldRender) {
    setShouldRender(true)
  }

  if (chordData && chordData !== displayData) {
    setDisplayData(chordData)
  }

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow render before opacity transition
      const raf = requestAnimationFrame(() => setIsVisible(true))
      return () => cancelAnimationFrame(raf)
    } else {
      const raf = requestAnimationFrame(() => setIsVisible(false))
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => {
        cancelAnimationFrame(raf)
        clearTimeout(timer)
      }
    }
  }, [isOpen])

  if (!shouldRender || !displayData) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 bg-stone-200/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div 
        className={`relative bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl transform transition-all duration-300 ease-out flex flex-col max-h-[90vh] overflow-y-auto ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
      >
        <h3 className="text-3xl font-serif italic text-stone-800 mb-6 text-center">{displayData.name}</h3>
        
        <div className="flex justify-around my-8">
          {displayData.notes.map((note, index) => (
            <div key={note + index} className="text-center">
              <span className="text-5xl font-bold text-stone-800">{note}</span>
              <span className="block text-sm text-stone-500 mt-1 font-serif italic">
                {[1, 3, 5, 7][index]}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
            {['Root Position', '1st Inversion', '2nd Inversion', '3rd Inversion'].map((label, i) => (
                <div key={label} className="flex flex-col items-center w-full">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">{label}</h4>
                    <button 
                        onClick={() => onPlayInversion(displayData.inversions[i])}
                        className="w-full bg-stone-50 rounded-lg p-2 shadow-inner hover:bg-stone-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-200"
                    >
                        <PianoKeyboard 
                            highlightedNotes={displayData.inversions[i]} 
                            className="w-full pointer-events-none"
                            startMidi={48}
                            endMidi={72}
                        />
                    </button>
                </div>
            ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-stone-800 text-stone-50 rounded-xl font-medium hover:bg-stone-700 transition-colors shadow-sm"
        >
          Close
        </button>
      </div>
    </div>
  )
}

const LongPressButton = ({
  onClick,
  onLongPress,
  children,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  onLongPress: () => void
  onClick: () => void
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPress = useRef(false)

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    isLongPress.current = false
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress()
    }, 500)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!isLongPress.current) {
      onClick()
    }
    e.currentTarget.releasePointerCapture(e.pointerId)
  }
  
  const handlePointerLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      // Prevent default context menu on long press
      onContextMenu={(e) => e.preventDefault()}
      className={`${className} touch-none select-none`}
      {...props}
    >
      {children}
    </button>
  )
}

const KeySelector = ({
  currentKey,
  currentMode,
  preferredMinorMode,
  onSelectKey,
  enabledKeys,
  onToggleKey,
  onReset
}: {
  currentKey: string
  currentMode: ScaleType
  preferredMinorMode: ScaleType
  onSelectKey: (key: string, mode: ScaleType) => void
  enabledKeys: string[]
  onToggleKey: (key: string) => void
  onReset: () => void
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
        <div className="bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden w-[280px] max-h-[60vh] flex flex-col">
          <div className="overflow-y-auto">
            <div className="grid grid-cols-[auto_1fr_auto_1fr] p-2 gap-x-2 gap-y-1 items-center w-max min-w-full">
              {KEY_OPTIONS.map(({ major, minor }) => {
                const majorKey = `${major} Major`
                const minorKey = `${minor} Minor`
                const isMajorEnabled = enabledKeys.includes(majorKey)
                const isMinorEnabled = enabledKeys.includes(minorKey)

                return (
                  <React.Fragment key={major}>
                    {/* Major */}
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={isMajorEnabled}
                        onChange={() => onToggleKey(majorKey)}
                        className="w-4 h-4 rounded text-stone-800 focus:ring-stone-500 border-gray-300"
                      />
                    </div>
                    <button
                      onClick={() => { onSelectKey(major, 'Major'); setIsOpen(false) }}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 whitespace-nowrap ${
                        currentKey === major && currentMode === 'Major'
                          ? 'bg-stone-100 text-stone-900 font-semibold'
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                      }`}
                    >
                      {majorKey}
                    </button>
                    
                    {/* Minor */}
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={isMinorEnabled}
                        onChange={() => onToggleKey(minorKey)}
                        className="w-4 h-4 rounded text-stone-800 focus:ring-stone-500 border-gray-300"
                      />
                    </div>
                    <button
                      onClick={() => { onSelectKey(minor, preferredMinorMode); setIsOpen(false) }}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 whitespace-nowrap ${
                        currentKey === minor && currentMode !== 'Major'
                          ? 'bg-stone-100 text-stone-900 font-semibold'
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                      }`}
                    >
                      {minorKey}
                    </button>
                  </React.Fragment>
                )
              })}
            </div>
          </div>
          
          <div className="p-2 border-t border-stone-100 bg-stone-50">
            <button 
              onClick={() => onReset()}
              className="w-full py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-colors active:bg-stone-50"
            >
              Empty
            </button>
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

const STATIC_ROW_CONFIG = {
  name: { fontClass: "font-bold", textClass: "text-sm md:text-base", rowIndex: 0 },
  roman: { fontClass: "font-medium", textClass: "text-sm md:text-base", rowIndex: 1 },
  mode: { fontClass: "font-medium", textClass: "text-[10px]", rowIndex: 2 },
}

const StaticRow = ({
  rowType,
  data,
  onClickChord,
  onLongPressChord,
  animKey
}: {
  rowType: 'name' | 'roman' | 'mode'
  data: readonly string[]
  onClickChord: (index: number) => void
  onLongPressChord: (index: number) => void
  animKey: string
}) => {
  const { fontClass, textClass, rowIndex } = STATIC_ROW_CONFIG[rowType];
  return (
    <>
      <div /> {/* Ghost Column */}
      {data.map((content, colIndex) => {
        const delay = (rowIndex + colIndex) * 35
        return (
          <LongPressButton
            key={`${rowType}-${colIndex}`}
            onClick={() => onClickChord(colIndex)}
            onLongPress={() => onLongPressChord(colIndex)}
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
          </LongPressButton>
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
            className={`aspect-square flex items-center justify-center font-bold text-xl rounded-lg hover:bg-stone-100 transition-colors select-none ${isAccent ? 'text-cyan-500' : 'text-stone-800'}`}
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
  isVisible,
  onPlayNote
}: {
  rows: string[][]
  animKey: string
  isVisible: boolean
  onPlayNote: (note: string) => void
}) => {
  const [flashState, setFlashState] = useState<Record<string, number>>({});

  const rootMidiBase = resolveMidi(rows[6][0]) ?? 0;
  
  const scaleMidi = rows[6].map(noteStr => {
    let m = resolveMidi(noteStr) ?? 0;
    while (m < rootMidiBase) m += 12; // Ensure the scale only moves upward from the root
    return m;
  });

  const getNoteToPlay = (rowIndex: number, colIndex: number) => {
    const absDegree = rowIndex + colIndex;
    const octaves = Math.floor(absDegree / 7);
    const degree = absDegree % 7;
    
    // Base MIDI 48 is C3, making the top left corner the lowest note
    const midi = scaleMidi[degree] + octaves * 12 + 48; 
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    return `${notes[midi % 12]}${octave}`;
  };

  const handleCellClick = (rowIndex: number, colIndex: number, noteToPlay: string) => {
    onPlayNote(noteToPlay);
    const cellKey = `${rowIndex}-${colIndex}`;
    setFlashState(prev => ({ ...prev, [cellKey]: (prev[cellKey] || 0) + 1 }));
  };

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden px-1">
        <div className="grid grid-cols-8 gap-3 pt-3 pb-2">
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
                  className={`aspect-square flex items-center justify-center font-bold text-xl rounded-lg ${isAccent ? 'text-cyan-500' : 'text-stone-800'} transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  }`}
                  style={{ transitionDelay: isVisible ? `${baseDelay}ms` : '0ms' }}
                >
                  {rowNum}
                </div>

                {/* Note Cells */}
                {rowData.map((note, colIndex) => {
                  const delay = baseDelay + colIndex * 30
                  const cellKey = `${rowIndex}-${colIndex}`
                  const flashCount = flashState[cellKey] || 0
                  
                  return (
                    <button
                      key={`note-${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(rowIndex, colIndex, getNoteToPlay(rowIndex, colIndex))}
                      className={`relative aspect-square flex items-center justify-center rounded-lg border border-stone-200 bg-white hover:bg-stone-50 active:bg-stone-100 cursor-pointer focus:outline-none shadow-sm font-medium select-none ${isAccent ? 'text-cyan-500' : 'text-stone-800'} transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                      }`}
                      style={{ transitionDelay: isVisible ? `${delay}ms` : '0ms' }}
                    >
                      {flashCount > 0 && (
                        <div 
                          key={flashCount}
                          className="absolute inset-0 rounded-lg animate-border-blink pointer-events-none"
                        />
                      )}
                      <span
                        key={`${animKey}-${rowIndex}-${colIndex}`}
                        className="relative z-10"
                        style={{
                          animation: 'rippleFadeIn 0.4s cubic-bezier(0.2, 0, 0.2, 1) backwards',
                          animationDelay: `${delay}ms`,
                          display: 'inline-block'
                        }}
                      >
                        {note}
                      </span>
                    </button>
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
  const [enabledKeys, setEnabledKeys] = useState<string[]>(ALL_PICKER_ITEMS)
  const [modalData, setModalData] = useState<{ name: string; notes: string[]; inversions: string[][] } | null>(null)
  const { playSound } = useAudioEngine()

  const gridData = generateGridData(currentKey, currentMode)
  
  // Animation key triggers re-render of span animations when key/mode changes
  const animKey = `${currentKey}-${currentMode}`

  // Construct the string representation for the picker based on current state
  const currentPickerItem = `${currentKey} ${currentMode === 'Major' ? 'Major' : 'Minor'}`

  const handlePickerSelect = (item: string) => {
    // Parse "Root Mode" string, e.g. "C Major" or "C# Minor"
    const lastSpaceIndex = item.lastIndexOf(' ')
    if (lastSpaceIndex !== -1) {
      const key = item.substring(0, lastSpaceIndex)
      const modeStr = item.substring(lastSpaceIndex + 1) // "Major" or "Minor"
      
      if (modeStr === 'Minor') {
        setCurrentKey(key)
        setCurrentMode(preferredMinorMode)
      } else {
        setCurrentKey(key)
        setCurrentMode('Major')
      }
    } else {
      // Fallback if parsing fails
      setCurrentKey(item)
    }
  }

  const handleToggleKey = (key: string) => {
    setEnabledKeys(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key)
      } else {
        // Re-insert in correct order based on KEY_OPTIONS
        const newSet = new Set([...prev, key])
        return ALL_PICKER_ITEMS.filter(k => newSet.has(k))
      }
    })
  }

  const handleLongPress = async (index: number) => {
    const chordName = gridData.chordNames[index];
    
    const notes = extractChordNotes(gridData, index);
    const root = notes[0];
    const inversions = shiftOctavesDown(getChordInversions(root, notes));
    
    if (inversions.length > 0) {
      await playSound(inversions[0], '2n');
    }

    setModalData({ name: chordName, notes, inversions });
  }

  const handleChordClick = async (colIndex: number) => {
    const notes = extractChordNotes(gridData, colIndex);
    const newRoot = notes[0];

    // 2. Identify Mode (Major/Minor)
    const chordName = gridData.chordNames[colIndex]
    const suffix = chordName.slice(newRoot.length)
    const isMinor = suffix.startsWith('m') || suffix.startsWith('dim')

    // Play audio for the chord
    const inversions = shiftOctavesDown(getChordInversions(newRoot, notes));
    if (inversions.length > 0) {
      await playSound(inversions[0], '2n');
    }
    
    const modeString = isMinor ? 'Minor' : 'Major'

    // 3. Normalize Root to match available keys if possible
    let canonicalRoot = newRoot
    const pickerString = `${newRoot} ${modeString}`
    
    if (!ALL_PICKER_ITEMS.includes(pickerString)) {
      const alt = ENHARMONICS[newRoot]
      if (alt && ALL_PICKER_ITEMS.includes(`${alt} ${modeString}`)) {
        canonicalRoot = alt
      }
    }

    // 4. Update State
    setCurrentKey(canonicalRoot)
    if (isMinor) {
      setCurrentMode(preferredMinorMode)
    } else {
      setCurrentMode('Major')
    }

    // 5. Ensure the selected key is enabled in the picker
    const newItem = `${canonicalRoot} ${modeString}`
    setEnabledKeys(prev => {
      if (prev.includes(newItem)) return prev
      const newSet = new Set([...prev, newItem])
      return ALL_PICKER_ITEMS.filter(k => newSet.has(k))
    })
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <style>{`
        @keyframes rippleFadeIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes borderBlink {
          0% { box-shadow: inset 0 0 0 2px #06b6d4; background-color: rgba(6, 182, 212, 0.1); }
          100% { box-shadow: inset 0 0 0 0px transparent; background-color: transparent; }
        }
        .animate-border-blink {
          animation: borderBlink 0.3s ease-out forwards;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-8 mb-8">
        <HorizontalPicker 
          items={enabledKeys} 
          selectedItem={currentPickerItem} 
          onSelectItem={handlePickerSelect} 
        />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <KeySelector 
            currentKey={currentKey} 
            currentMode={currentMode}
            preferredMinorMode={preferredMinorMode}
            enabledKeys={enabledKeys}
            onSelectKey={(key, mode) => {
              setCurrentKey(key)
              setCurrentMode(mode)
              
              // Ensure the selected key is enabled in the picker
              const pickerItem = `${key} ${mode === 'Major' ? 'Major' : 'Minor'}`
              setEnabledKeys(prev => {
                if (prev.includes(pickerItem)) return prev
                const newSet = new Set([...prev, pickerItem])
                return ALL_PICKER_ITEMS.filter(k => newSet.has(k))
              })
            }}
            onToggleKey={handleToggleKey}
            onReset={() => {
              setEnabledKeys(['C Major'])
              setCurrentKey('C')
              setCurrentMode('Major')
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
          <div className="grid grid-cols-8 gap-3 px-1">
            <StaticRow rowType="name" data={gridData.chordNames} onClickChord={handleChordClick} onLongPressChord={handleLongPress} animKey={animKey} />
            <StaticRow rowType="roman" data={gridData.romanNumerals} onClickChord={handleChordClick} onLongPressChord={handleLongPress} animKey={animKey} />
            <StaticRow rowType="mode" data={gridData.modes} onClickChord={handleChordClick} onLongPressChord={handleLongPress} animKey={animKey} />
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
            onPlayNote={(note) => playSound(note)}
          />
          
          <InfoModal 
            isOpen={modalData !== null} 
            onClose={() => setModalData(null)}
            chordData={modalData}
          onPlayInversion={(notes) => playSound(notes, '2n')}
          />

        </div>
      </div>
    </div>
  )
}
