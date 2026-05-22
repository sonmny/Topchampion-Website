import "@/App.css";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { LangProvider } from "./i18n/LangContext";
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
} from "./pages/InnerPages";

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
      <BrowserRouter>
        <Routes>
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
    </LangProvider>
  );
}

export default App;
