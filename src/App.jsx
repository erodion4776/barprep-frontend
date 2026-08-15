import { Routes, Route }    from 'react-router-dom'
import { lazy, Suspense }   from 'react'
import { Link }             from 'react-router-dom'

import Navbar         from './components/Navbar'
import Footer         from './components/Footer'
import CookieBanner   from './components/CookieBanner'
import PrivateRoute   from './components/PrivateRoute'
import LoadingSpinner from './components/LoadingSpinner'

// ── Eager imports (critical path) ─────────────────────────────────────────────
import LandingPage from './pages/LandingPage'
import Login       from './pages/Login'
import Signup      from './pages/Signup'

// ── Lazy imports (loaded on demand) ──────────────────────────────────────────
const Home           = lazy(() => import('./pages/Home'))
const Chat           = lazy(() => import('./pages/Chat'))
const StudyModules   = lazy(() => import('./pages/StudyModules'))
const MockExam       = lazy(() => import('./pages/MockExam'))
const Tutorials      = lazy(() => import('./pages/Tutorials'))
const ModuleDetail   = lazy(() => import('./pages/ModuleDetail'))
const Admin          = lazy(() => import('./pages/Admin'))
const AdminLogin     = lazy(() => import('./pages/AdminLogin'))
const Blog           = lazy(() => import('./pages/Blog'))
const BlogPost       = lazy(() => import('./pages/BlogPost'))
const Settings       = lazy(() => import('./pages/Settings'))
const ResetPassword  = lazy(() => import('./pages/ResetPassword'))
const Pricing        = lazy(() => import('./pages/Pricing'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))
const PrivacyPolicy  = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const CookiePolicy   = lazy(() => import('./pages/CookiePolicy'))
const Disclaimer     = lazy(() => import('./pages/Disclaimer'))
const FAQ            = lazy(() => import('./pages/FAQ'))
const Contact        = lazy(() => import('./pages/Contact'))
const About          = lazy(() => import('./pages/About'))

// ── Page wrapper ──────────────────────────────────────────────────────────────
function PageWrapper({ children }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </div>
  )
}

// ── Lazy loading fallback ─────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  )
}

// ── 404 page ──────────────────────────────────────────────────────────────────
function NotFound() {
  return (
    <PageWrapper>
      <div className="text-center py-20 space-y-6">
        <div className="text-8xl font-black text-slate-100 select-none">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Page Not Found
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/"
            className="px-6 py-2.5 bg-blue-600 text-white text-sm
                       font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Go Back Home →
          </Link>
          <Link
            to="/blog"
            className="px-6 py-2.5 border border-slate-200 text-slate-600
                       text-sm font-bold rounded-xl hover:bg-slate-50
                       transition-colors"
          >
            Read the Blog
          </Link>
          <Link
            to="/faq"
            className="px-6 py-2.5 border border-slate-200 text-slate-600
                       text-sm font-bold rounded-xl hover:bg-slate-50
                       transition-colors"
          >
            Visit FAQ
          </Link>
        </div>
      </div>
    </PageWrapper>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Main content ── */}
      <main className="flex-1 w-full">
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ════════════════════════════════════════
                PUBLIC ROUTES — No login required
            ════════════════════════════════════════ */}

            {/* Landing page */}
            <Route
              path="/"
              element={<LandingPage />}
            />

            {/* Auth */}
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
            <Route
              path="/reset-password"
              element={
                <PageWrapper>
                  <ResetPassword />
                </PageWrapper>
              }
            />

            {/* Pricing */}
            <Route
              path="/pricing"
              element={
                <PageWrapper>
                  <Pricing />
                </PageWrapper>
              }
            />

            {/* Payment success */}
            <Route
              path="/payment-success"
              element={
                <PageWrapper>
                  <PaymentSuccess />
                </PageWrapper>
              }
            />

            {/* Blog — fully public */}
            <Route
              path="/blog"
              element={
                <PageWrapper>
                  <Blog />
                </PageWrapper>
              }
            />
            <Route
              path="/blog/:slug"
              element={
                <PageWrapper>
                  <BlogPost />
                </PageWrapper>
              }
            />

            {/* ── TUTORIALS — Videos are FREE, no login needed ── */}
            <Route
              path="/tutorials"
              element={
                <PageWrapper>
                  <Tutorials />
                </PageWrapper>
              }
            />
            {/* Video detail is PUBLIC — AI chat inside is gated by plan */}
            <Route
              path="/tutorials/:id"
              element={
                <PageWrapper>
                  <ModuleDetail />
                </PageWrapper>
              }
            />

            {/* Info pages */}
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

            {/* Legal pages */}
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

            {/* ════════════════════════════════════════
                PROTECTED ROUTES — Login required
            ════════════════════════════════════════ */}

            {/* Home dashboard */}
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <PageWrapper>
                    <Home />
                  </PageWrapper>
                </PrivateRoute>
              }
            />

            {/* AI Coach chat */}
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <PageWrapper>
                    <Chat />
                  </PageWrapper>
                </PrivateRoute>
              }
            />

            {/* Study center */}
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

            {/* Mock exam */}
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

            {/* Settings */}
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <PageWrapper>
                    <Settings />
                  </PageWrapper>
                </PrivateRoute>
              }
            />

            {/* ════════════════════════════════════════
                ADMIN ROUTES
            ════════════════════════════════════════ */}

            <Route
              path="/admin/login"
              element={
                <PageWrapper>
                  <AdminLogin />
                </PageWrapper>
              }
            />
            <Route
              path="/admin"
              element={
                <PageWrapper>
                  <Admin />
                </PageWrapper>
              }
            />

            {/* ════════════════════════════════════════
                404 CATCH ALL
            ════════════════════════════════════════ */}

            <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>
      </main>

      {/* ── Footer ── */}
      <Footer />

      {/* ── Cookie consent banner ── */}
      <CookieBanner />

    </div>
  )
}
