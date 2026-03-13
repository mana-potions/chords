import { useEffect, useRef } from 'react'

export const useClickOutside = (
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
  isActive: boolean
) => {
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
