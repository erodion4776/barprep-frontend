import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import PrivateRoute from './components/PrivateRoute'
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
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import CookiePolicy from './pages/CookiePolicy'
import Disclaimer from './pages/Disclaimer'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import About from './pages/About'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Top Navigation ─────────────────────────────────────── */}
      <Navbar />

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full
                       px-4 sm:px-6 lg:px-8 py-8">
        <Routes>

          {/* ── Public Routes ──────────────────────────────────── */}
          <Route path="/"         element={<Home />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/signup"   element={<Signup />} />
          <Route path="/about"    element={<About />} />
          <Route path="/faq"      element={<FAQ />} />
          <Route path="/contact"  element={<Contact />} />

          {/* ── Legal Routes ───────────────────────────────────── */}
          <Route path="/privacy"    element={<PrivacyPolicy />} />
          <Route path="/terms"      element={<TermsOfService />} />
          <Route path="/cookies"    element={<CookiePolicy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />

          {/* ── Protected Routes (login required) ──────────────── */}
          <Route path="/chat"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
          <Route path="/study"
            element={
              <PrivateRoute>
                <StudyModules />
              </PrivateRoute>
            }
          />
          <Route path="/mock-exam"
            element={
              <PrivateRoute>
                <MockExam />
              </PrivateRoute>
            }
          />
          <Route path="/tutorials"
            element={
              <PrivateRoute>
                <Tutorials />
              </PrivateRoute>
            }
          />
          <Route path="/tutorials/:id"
            element={
              <PrivateRoute>
                <ModuleDetail />
              </PrivateRoute>
            }
          />

          {/* ── Admin Routes ───────────────────────────────────── */}
          <Route path="/admin"       element={<Admin />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ── 404 Catch All ──────────────────────────────────── */}
          <Route path="*"
            element={
              <div className="text-center py-20 space-y-4">
                <div className="text-6xl">404</div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Page Not Found
                </h1>
                <p className="text-slate-500 text-sm">
                  The page you are looking for does not exist.
                </p>
                <a href="/"
                  className="inline-block mt-4 px-6 py-2.5 bg-blue-600
                             text-white text-sm font-bold rounded-xl
                             hover:bg-blue-700 transition-colors">
                  Go Back Home →
                </a>
              </div>
            }
          />

        </Routes>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <Footer />

      {/* ── Cookie Consent Banner ──────────────────────────────── */}
      <CookieBanner />

    </div>
  )
}
