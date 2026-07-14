import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Chat from './pages/Chat'
import StudyModules from './pages/StudyModules'
import MockExam from './pages/MockExam'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/chat"        element={<Chat />} />
          <Route path="/study"       element={<StudyModules />} />
          <Route path="/mock-exam"   element={<MockExam />} />
        </Routes>
      </main>
    </div>
  )
}
