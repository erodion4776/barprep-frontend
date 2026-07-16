import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Chat from './pages/Chat'
import StudyModules from './pages/StudyModules'
import MockExam from './pages/MockExam'
import Tutorials from './pages/Tutorials'
import ModuleDetail from './pages/ModuleDetail'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import Login from './pages/Login'
import Signup from './pages/Signup'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/chat"          element={<Chat />} />
          <Route path="/study"         element={<StudyModules />} />
          <Route path="/mock-exam"     element={<MockExam />} />
          <Route path="/tutorials"     element={<Tutorials />} />
          <Route path="/tutorials/:id" element={<ModuleDetail />} />
          <Route path="/admin"         element={<Admin />} />
          <Route path="/admin/login"   element={<AdminLogin />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/signup"        element={<Signup />} />
        </Routes>
      </main>
    </div>
  )
}
