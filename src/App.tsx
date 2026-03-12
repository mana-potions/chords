import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/MainLayout'
import { HomePage } from './features/HomePage'
import { TonicTargetPractice } from './components/TonicTargetPractice'
import { ChordGrid } from './components/ChordGrid'

function App() {
  console.log("App component is rendering")

  return (
    <Routes>
      <Route path="/" element={
        <MainLayout>
          <HomePage />
        </MainLayout>
      } />
      <Route path="/tonic-target" element={
        <MainLayout bgClass="bg-green-50">
          <TonicTargetPractice />
        </MainLayout>
      } />
      <Route path="/chord-grid" element={
        <MainLayout>
          <ChordGrid />
        </MainLayout>
      } />
      <Route path="*" element={
        <MainLayout>
          <div className="p-10 text-center">
            <h2 className="text-xl font-bold text-red-600">404 - Page Not Found</h2>
            <p>The route you are trying to access does not exist.</p>
          </div>
        </MainLayout>
      } />
    </Routes>
  )
}

export default App
