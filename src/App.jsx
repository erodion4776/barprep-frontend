import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import PrivateRoute from './components/PrivateRoute'
import LandingPage from './pages/LandingPage'
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

// ── Wrapper for pages that need padding/max-width ────────────────
const PageWrapper = ({ children }) => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {children}
  </div>
)

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Top Navigation ─────────────────────────────────────── */}
      <Navbar />

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="flex-1 w-full">
        <Routes>

          {/* ══════════════════════════════════════════════════════
              PUBLIC ROUTES
          ══════════════════════════════════════════════════════ */}

          {/* Landing Page — first thing visitors see */}
          <Route
            path="/"
            element={<LandingPage />}
          />

          {/* Dashboard — home for logged-in users */}
          <Route
            path="/dashboard"
            element={
              <PageWrapper>
                <Home />
              </PageWrapper>
            }
          />

          {/* ══════════════════════════════════════════════════════
              AUTH ROUTES
          ══════════════════════════════════════════════════════ */}

          <Route
            path="/login"
            element={
              <PageWrapper>
                <Login />
              </PageWrapper>
            }
          />

          <Route
            path="/signup"
            element={
              <PageWrapper>
                <Signup />
              </PageWrapper>
            }
          />

          {/* ══════════════════════════════════════════════════════
              PROTECTED ROUTES (login required)
          ══════════════════════════════════════════════════════ */}

          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <div className="max-w-6xl mx-auto
                                px-4 sm:px-6 lg:px-8 py-8">
                  <Chat />
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/study"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <StudyModules />
                </PageWrapper>
              </PrivateRoute>
            }
          />

          <Route
            path="/mock-exam"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <MockExam />
                </PageWrapper>
              </PrivateRoute>
            }
          />

          <Route
            path="/tutorials"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <Tutorials />
                </PageWrapper>
              </PrivateRoute>
            }
          />

          <Route
            path="/tutorials/:id"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <ModuleDetail />
                </PageWrapper>
              </PrivateRoute>
            }
          />

          {/* ══════════════════════════════════════════════════════
              ADMIN ROUTES
          ══════════════════════════════════════════════════════ */}

          <Route
            path="/admin"
            element={<Admin />}
          />

          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          {/* ══════════════════════════════════════════════════════
              INFO PAGES
          ══════════════════════════════════════════════════════ */}

          <Route
            path="/about"
            element={
              <PageWrapper>
                <About />
              </PageWrapper>
            }
          />

          <Route
            path="/faq"
            element={
              <PageWrapper>
                <FAQ />
              </PageWrapper>
            }
          />

          <Route
            path="/contact"
            element={
              <PageWrapper>
                <Contact />
              </PageWrapper>
            }
          />

          {/* ══════════════════════════════════════════════════════
              LEGAL PAGES
          ══════════════════════════════════════════════════════ */}

          <Route
            path="/privacy"
            element={
              <PageWrapper>
                <PrivacyPolicy />
              </PageWrapper>
            }
          />

          <Route
            path="/terms"
            element={
              <PageWrapper>
                <TermsOfService />
              </PageWrapper>
            }
          />

          <Route
            path="/cookies"
            element={
              <PageWrapper>
                <CookiePolicy />
              </PageWrapper>
            }
          />

          <Route
            path="/disclaimer"
            element={
              <PageWrapper>
                <Disclaimer />
              </PageWrapper>
            }
          />

          {/* ══════════════════════════════════════════════════════
              404 — CATCH ALL
          ══════════════════════════════════════════════════════ */}

          <Route
            path="*"
            element={
              <PageWrapper>
                <div className="text-center py-20 space-y-6">
                  <div className="text-8xl font-black text-slate-100
                                  select-none">
                    404
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                      Page Not Found
                    </h1>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                      The page you are looking for does not exist
                      or has been moved.
                    </p>
                  </div>
                  <div className="flex items-center justify-center
                                  gap-3 flex-wrap">
                    <a
                      href="/"
                      className="px-6 py-2.5 bg-blue-600 text-white
                                 text-sm font-bold rounded-xl
                                 hover:bg-blue-700 transition-colors">
                      Go Back Home →
                    </a>
                    <a
                      href="/faq"
                      className="px-6 py-2.5 border border-slate-200
                                 text-slate-600 text-sm font-bold
                                 rounded-xl hover:bg-slate-50
                                 transition-colors">
                      Visit FAQ
                    </a>
                  </div>
                </div>
              </PageWrapper>
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
