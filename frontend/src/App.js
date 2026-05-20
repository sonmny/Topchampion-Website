import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
  </div>
);

function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  );
}

export default App;
