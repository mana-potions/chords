import React from 'react'

export const ChordGrid = () => {
  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      {/* 
        Using a single grid with 8 columns to maintain alignment between 
        the top 'description' column and the bottom grid.
      */}
      <div className="grid grid-cols-8 gap-3">
        
        {/* --- Top Section: Note Number (7 rows) --- */}
        {Array.from({ length: 7 }).map((_, rowIndex) => {
          const rowNum = 7 - rowIndex
          // "starting with row 1 as red, ending with row 7 as red" -> Odd rows are red
          const isRed = rowNum % 2 !== 0
          const textColorClass = isRed ? 'text-red-600' : 'text-stone-800'

          return (
            <React.Fragment key={`top-row-${rowNum}`}>
              {/* Column 1: Row Description (Row Number) */}
              <button className={`aspect-square flex items-center justify-center font-bold text-xl rounded-lg hover:bg-stone-100 transition-colors ${textColorClass}`}>
                {rowNum}
              </button>

              {/* Columns 2-8: Data Buttons */}
              {Array.from({ length: 7 }).map((_, colIndex) => (
                <button
                  key={`top-btn-${rowNum}-${colIndex}`}
                  className={`aspect-square rounded-lg border border-stone-200 bg-white hover:bg-stone-50 active:bg-stone-100 transition-colors shadow-sm ${textColorClass}`}
                >
                  {/* Content to be filled later */}
                </button>
              ))}
            </React.Fragment>
          )
        })}

        {/* Visual Spacer between sections */}
        <div className="col-span-8 h-4" />

        {/* --- Bottom Section: 4 rows --- */}
        {Array.from({ length: 4 }).map((_, rowIndex) => {
          const rowNum = rowIndex + 1

          return (
            <React.Fragment key={`bottom-row-${rowNum}`}>
              {/* Ghost Column (matches top description column width) */}
              <div />

              {/* 7 Data Columns */}
              {Array.from({ length: 7 }).map((_, colIndex) => {
                if (rowNum === 1) {
                  const num = colIndex + 1
                  const isRed = num % 2 !== 0
                  const textColorClass = isRed ? 'text-red-600' : 'text-stone-800'
                  return (
                    <button
                      key={`bottom-btn-${rowNum}-${colIndex}`}
                      className={`aspect-square flex items-center justify-center font-bold text-xl rounded-lg hover:bg-stone-100 transition-colors ${textColorClass}`}
                    >
                      {num}
                    </button>
                  )
                }
                return (
                  <button
                    key={`bottom-btn-${rowNum}-${colIndex}`}
                    className="aspect-square flex items-center justify-center rounded-lg border border-stone-200 bg-white hover:bg-stone-50 active:bg-stone-100 transition-colors shadow-sm font-medium text-stone-800"
                  />
                )
              })}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}