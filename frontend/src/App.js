import "@/App.css";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { LangProvider } from "./i18n/LangContext";
import { AuthProvider } from "./admin/AuthContext";
import { ProtectedRoute } from "./admin/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { TrustBar } from "./components/TrustBar";
import { Stats } from "./components/Stats";
import { Solutions } from "./components/Solutions";
import { EngineeringTimeline } from "./components/EngineeringTimeline";
import { CaseStudies } from "./components/CaseStudies";
import { SmartQuoteForm } from "./components/SmartQuoteForm";
import { Footer } from "./components/Footer";
import { Toaster } from "./components/ui/sonner";
import { SolutionsHub, SolutionDetail } from "./pages/SolutionsPages";
import {
  EngineeringPage,
  CasesPage,
  ContactPage,
  AboutPage,
  CareersPage,
  CertificationsPage,
  PrivacyPage,
  NotFoundPage,
} from "./pages/InnerPages";
import { AdminLogin } from "./admin/pages/AdminLogin";
import { AdminDashboard } from "./admin/pages/AdminDashboard";
import { ProjectsList } from "./admin/pages/ProjectsList";
import { ProjectDetail } from "./admin/pages/ProjectDetail";
import { ProjectForm } from "./admin/pages/ProjectForm";
import { UsersList } from "./admin/pages/UsersList";

const Landing = () => (
  <div className="App relative bg-[#0A0A0A] text-white min-h-screen" data-testid="landing-root">
    <Navbar />
    <main>
      <Hero />
      <TrustBar />
      <Stats />
      <Solutions />
      <EngineeringTimeline />
      <CaseStudies />
      <SmartQuoteForm />
    </main>
    <Footer />
  </div>
);

const SolutionDetailRoute = () => {
  const { slug } = useParams();
  return <SolutionDetail slug={slug} />;
};

function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public landing + inner pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/solutions" element={<SolutionsHub />} />
            <Route path="/solutions/:slug" element={<SolutionDetailRoute />} />
            <Route path="/engineering" element={<EngineeringPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/certifications" element={<CertificationsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/projects" element={<ProtectedRoute><ProjectsList /></ProtectedRoute>} />
            <Route path="/admin/projects/new" element={<ProtectedRoute allowed={["admin"]}><ProjectForm mode="new" /></ProtectedRoute>} />
            <Route path="/admin/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/admin/projects/:id/edit" element={<ProtectedRoute allowed={["admin"]}><ProjectForm mode="edit" /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowed={["admin"]}><UsersList /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#0F0F0F",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              borderRadius: 0,
              fontFamily: "'IBM Plex Sans', sans-serif",
            },
          }}
        />
      </AuthProvider>
    </LangProvider>
  );
}

export default App;
