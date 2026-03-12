import type { ReactNode } from 'react'

interface MainLayoutProps {
  children: ReactNode
  bgClass?: string
}

export const MainLayout = ({ children, bgClass = "bg-stone-50" }: MainLayoutProps) => {
  return (
    <div className={`min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] w-full ${bgClass} text-stone-800 font-sans`}>
      {children}
    </div>
  )
}
