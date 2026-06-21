/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Download, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  CheckCheck, 
  HelpCircle, 
  Lightbulb, 
  RefreshCw, 
  BarChart3, 
  Database, 
  Globe, 
  Sparkles, 
  ShoppingBag, 
  Eye, 
  Terminal,
  Heart,
  ChevronRight,
  Info,
  BadgeAlert,
  ArrowBigUpDash,
  Menu,
  X,
  Play,
  Star,
  Leaf
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  DEMO_PRODUCTS, 
  TRUSTED_STORES, 
  PROBLEM_CARDS, 
  STEP_GUIDES, 
  STATS, 
  COMPARISONS, 
  FAQS 
} from "./data";
import { ProductAnalysis } from "./types";

const LogoIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg 
    viewBox="0 0 120 120" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`${className} transition-transform duration-300 group-hover:rotate-6`}
  >
    {/* Clean circular outer ring in exact brand green */}
    <circle cx="60" cy="60" r="48" stroke="#0B7A4C" strokeWidth="6" fill="none" />
    
    {/* Semicircular top loop and horizontal crossbar of the 'e' */}
    <path 
      d="M 38,60 H 82 C 82,34 38,34 38,60" 
      stroke="#0B7A4C" 
      strokeWidth="7" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      fill="none" 
    />

    {/* Integrated leaf design forming the bottom loop of the 'e' */}
    <path 
      d="M 38,60 C 38,76 46,88 62,88 C 76,88 86,78 86,66 C 86,66 74,72 61,72 C 48,72 38,60 38,60 Z" 
      fill="#0B7A4C" 
    />

    {/* Crisp high-fidelity white central vein inside the leaf */}
    <path 
      d="M 44,75 C 54,77 66,75 80,69" 
      stroke="#FFFFFF" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      opacity="0.95"
    />
  </svg>
);

export default function App() {
  // Simulator State
  const [activeAnalysis, setActiveAnalysis] = useState<ProductAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("patagonia");

  // Download states for the Hero CTA Button
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Dynamic Background Overrides
  const [problemBg, setProblemBg] = useState<string | null>(null);
  const [solutionBg, setSolutionBg] = useState<string | null>(null);
  const [impactBg, setImpactBg] = useState<string | null>(null);
  const [showcaseBg, setShowcaseBg] = useState<string | null>(null);

  // Solution Flow Active Step
  const [activeSolutionStep, setActiveSolutionStep] = useState(0);

  // FAQ Accordion Active Index
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selected educational product in the True Cost awareness section
  const [selectedEduProduct, setSelectedEduProduct] = useState("fleece");

  // Stats Tracker Simulation
  const [productsTracked, setProductsTracked] = useState(2410382);
  const [carbonSaved, setCarbonSaved] = useState(14812.4);

  // Active section state tracker for premium look & feel
  const [activeSection, setActiveSection] = useState<string>("");

  // IntersectionObserver effect to detect active sections
  useEffect(() => {
    const sections = [
      "problem-section",
      "solution-flow",
      "features-section",
      "extension-showcase",
      "installation-guide",
      "impact-section"
    ];

    const observerOptions = {
      root: null,
      rootMargin: "-40% 0px -45% 0px", // Nicely centered detector range
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  // Load the initial product analysis on mount
  useEffect(() => {
    fetchProductDetails("patagonia synchilla fleece");

    // Live counter ticking simulation for high conversion feel
    const interval = setInterval(() => {
      setProductsTracked(prev => prev + Math.floor(Math.random() * 2) + 1);
      setCarbonSaved(prev => prev + parseFloat((Math.random() * 0.1).toFixed(2)));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchProductDetails = async (productName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setActiveAnalysis(data);
      }
    } catch (err) {
      setError("Failed to fetch product intelligence details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (id: string, name: string) => {
    setSelectedProductId(id);
    fetchProductDetails(name);
  };

  const handleCustomSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    setSelectedProductId("custom");
    fetchProductDetails(customQuery);
  };

  const handleDownload = () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadSuccess(false);

    try {
      const shareUrl = "https://drive.google.com/file/d/1MEkRfK8aLDmUpiodL46AHXMg_dAr_KT1/view?usp=drive_link";
      
      // Extract the Google Drive File ID automatically from the sharing link
      let fileId = "1MEkRfK8aLDmUpiodL46AHXMg_dAr_KT1";
      const match = shareUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        fileId = match[1];
      }
      
      const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

      // Direct, standard hidden anchor download to ensure no duplicate prompts/popups and run on all devices
      const link = document.createElement("a");
      link.href = directDownloadUrl;
      link.setAttribute("download", "EcoIntercept.zip");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Subtle, satisfying loading success feedback loop
      setTimeout(() => {
        setDownloadSuccess(true);
        setDownloading(false);
      }, 1500);

      // Reset feedback back to original state after 4 seconds
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4500);
    } catch (err) {
      console.error("Downloader integration failed: ", err);
      setDownloading(false);
    }
  };

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Score Color Helper
  const getScoreColor = (score: number) => {
    if (score >= 85) return { border: "border-green-500", text: "text-green-400", bg: "bg-green-500/10", glow: "shadow-green-500/20" };
    if (score >= 60) return { border: "border-yellow-500", text: "text-yellow-400", bg: "bg-yellow-500/10", glow: "shadow-yellow-500/20" };
    return { border: "border-rose-500", text: "text-rose-400", bg: "bg-rose-500/10", glow: "shadow-rose-500/20" };
  };

  // Risk Color Helper
  const getRiskBadgeColor = (risk: "Low" | "Medium" | "High") => {
    switch (risk) {
      case "Low":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "High":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
    }
  };

  return (
    <div id="root-viewport" className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased selection:bg-[#22C55E]/20 selection:text-[#0D9488]">
      
      {/* GLOW DECORATIONS */}
      <div className="eco-glow animate-pulse-slow" style={{ top: "-100px", right: "-100px" }} />
      <div className="eco-glow" style={{ bottom: "-100px", left: "-100px" }} />
      <div className="eco-glow" style={{ top: "800px", right: "50px", background: "radial-gradient(circle, rgba(13, 148, 136, 0.08) 0%, transparent 70%)" }} />
      <div className="eco-glow" style={{ top: "2200px", left: "50px", background: "radial-gradient(circle, rgba(132, 204, 22, 0.08) 0%, transparent 70%)" }} />

      {/* HEADER / NAVIGATION */}
      <nav id="navbar" className="sticky top-0 z-50 glass-nav border-b border-slate-200/50 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div 
              className="flex items-center gap-3.5 group cursor-pointer shrink-0" 
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <LogoIcon className="w-11 h-11" />
              <div>
                <span className="font-display font-bold text-xl text-slate-900 tracking-tight">EcoIntercept<span className="text-[#0B7A4C]">.ai</span></span>
                <span className="block text-[8px] font-sans tracking-[0.24em] text-[#0B7A4C] uppercase font-bold leading-none mt-1 whitespace-nowrap">Sustainability Intelligence</span>
              </div>
            </div>
            
            {/* Desktop Navigation Link Menu items - 1024px+ only */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2 text-[14px]">
              {[
                { label: "Problem", sectionId: "problem-section" },
                { label: "Solution", sectionId: "solution-flow" },
                { label: "Features", sectionId: "features-section" },
                { label: "Showcase", sectionId: "extension-showcase" },
                { label: "Installation Guide", sectionId: "installation-guide" },
                { label: "About", sectionId: "impact-section" },
              ].map((link) => {
                const isActive = activeSection === link.sectionId;
                return (
                  <button
                    key={link.sectionId}
                    onClick={() => handleScrollToSection(link.sectionId)}
                    className={`relative h-10 px-4 rounded-xl font-medium transition-all duration-350 cursor-pointer flex items-center justify-center select-none ${
                      isActive 
                        ? "text-emerald-700 font-semibold" 
                        : "text-slate-600 hover:text-emerald-600 hover:bg-slate-100/40"
                    }`}
                  >
                    <span className="relative z-10">{link.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="activeNavBackground"
                        className="absolute inset-0 bg-emerald-500/10 rounded-xl border border-emerald-500/10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Desktop CTA Button - 1024px+ only */}
              <div className="hidden lg:block">
                <button 
                  id="header-cta-btn"
                  onClick={handleDownload}
                  className="relative inline-flex items-center gap-2 h-10 px-5 primary-btn rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer text-white tracking-wide select-none"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Try Extension</span>
                </button>
              </div>

              {/* Hamburger Button for Mobile/Tablet (<1024px) */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-700 hover:text-emerald-700 transition-colors focus:outline-none cursor-pointer rounded-lg hover:bg-slate-100"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Premium Full-Width Smooth Slide-Down Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop blur overlay beneath the bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 top-20 bg-slate-900/15 backdrop-blur-sm z-[45] cursor-pointer"
                transition={{ duration: 0.25 }}
              />

              {/* Dropdown Container */}
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="lg:hidden absolute top-20 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-xl overflow-hidden z-[50]"
              >
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-3">
                  {[
                    { label: "Problem", sectionId: "problem-section" },
                    { label: "Solution", sectionId: "solution-flow" },
                    { label: "Features", sectionId: "features-section" },
                    { label: "Showcase", sectionId: "extension-showcase" },
                    { label: "Installation Guide", sectionId: "installation-guide" },
                    { label: "About", sectionId: "impact-section" },
                  ].map((link) => {
                    const isActive = activeSection === link.sectionId;
                    return (
                      <button
                        key={link.sectionId}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setTimeout(() => handleScrollToSection(link.sectionId), 250);
                        }}
                        className={`block w-full text-left py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none cursor-pointer ${
                          isActive 
                            ? "text-emerald-700 bg-emerald-500/5 font-extrabold border border-emerald-500/10" 
                            : "text-slate-700 hover:text-emerald-600 hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        {link.label}
                      </button>
                    );
                  })}
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleDownload();
                      }}
                      className="w-full h-11 primary-btn text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10 text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Try Extension</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* ================================================
          SECTION 1: HERO
          ================================================ */}
      <header id="hero-section" className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden isolate bg-white">
        
        {/* PREMIUM HIGH-RESOLUTION VECTOR ART BACKGROUND */}
        <div className="absolute inset-0 -z-10 select-none overflow-hidden pointer-events-none">
          {/* Base organic gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#F5FBF8] via-[#FFFFFF] to-[#CFF7DF] opacity-90" />
          
          {/* Subtle gradient mesh glow blobs using the exact palette */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#A8D4FF]/20 via-[#6FD4C5]/10 to-transparent rounded-full filter blur-[120px] opacity-80 animate-pulse-slow" />
          <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-[#8FE3B0]/10 rounded-full filter blur-[100px] opacity-60" />
          <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] bg-[#A8D4FF]/10 rounded-full filter blur-[80px] opacity-40" />

          {/* CURVED SWEEPING WAVY LAYERS (BOTTOM OF HERO) */}
          <div className="absolute bottom-0 right-0 left-0 w-full overflow-hidden leading-none z-0">
            <svg 
              viewBox="0 0 1440 320" 
              className="w-full h-auto min-h-[160px] md:min-h-[260px] scale-y-[1.15] origin-bottom opacity-90"
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              {/* Layer 1 (Accent Blue transitioning to Accent Teal) */}
              <path 
                d="M0,240 C360,310 720,180 1080,270 C1240,310 1360,290 1440,240 L1440,320 L0,320 Z" 
                className="fill-[url(#eco-wave-grad-1)] opacity-30"
              />
              
              {/* Layer 2 (Accent Mint transitioning to Accent Green) */}
              <path 
                d="M0,180 C240,260 580,140 880,210 C1180,280 1320,180 1440,110 L1440,320 L0,320 Z" 
                className="fill-[url(#eco-wave-grad-2)] opacity-40"
              />
              
              {/* Layer 3 (Accent Teal transitioning to Accent Green - Crisp Front Layer) */}
              <path 
                d="M0,130 C320,200 640,10 960,80 C1120,110 1280,140 1440,170 L1440,320 L0,320 Z" 
                className="fill-[url(#eco-wave-grad-3)] opacity-45"
              />
              
              {/* Thin elegant flowing wave lines across the lower portion of the hero section */}
              <path 
                className="stroke-[#8FE3B0]/40 stroke-[1.5]" 
                d="M0,150 C320,220 640,30 960,100 C1120,130 1280,150 1440,180" 
                fill="none"
              />
              <path 
                className="stroke-[#6FD4C5]/30 stroke-[1]" 
                d="M0,210 C240,275 580,155 880,225 C1180,295 1320,195 1440,135" 
                fill="none"
              />
              <path 
                className="stroke-[#A8D4FF]/35 stroke-[1.2]" 
                d="M0,110 C400,180 700,-10 1000,60 C1180,100 1310,120 1440,90" 
                fill="none"
              />
              
              {/* Gradient defs matching user color palette */}
              <defs>
                <linearGradient id="eco-wave-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A8D4FF" />
                  <stop offset="100%" stopColor="#6FD4C5" />
                </linearGradient>
                <linearGradient id="eco-wave-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#CFF7DF" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#8FE3B0" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8FE3B0" />
                </linearGradient>
                <linearGradient id="eco-wave-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5FBF8" stopOpacity="0.4" />
                  <stop offset="40%" stopColor="#6FD4C5" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#8FE3B0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* SPARKLING STAR PARTICLES (Minimal eco-glows with precision) */}
          <div className="absolute top-[18%] left-[12%] w-1.5 h-1.5 bg-[#8FE3B0] rounded-full animate-pulse-slow opacity-60" />
          <div className="absolute top-[32%] right-[22%] w-2 h-2 bg-[#6FD4C5] rounded-full animate-pulse-slow opacity-50" />
          <div className="absolute top-[14%] right-[38%] text-[#8FE3B0]/40 text-[11px] animate-pulse-slow">✦</div>
          <div className="absolute top-[48%] left-[10%] text-[#6FD4C5]/30 text-base animate-pulse-slow">✦</div>
          <div className="absolute top-[22%] right-[11%] text-[#8FE3B0]/30 text-lg animate-pulse-slow">✦</div>
          <div className="absolute top-[58%] right-[32%] w-1.5 h-1.5 bg-[#A8D4FF] rounded-full animate-pulse-slow opacity-60" />

          {/* VERY SUBTLE FLOATING LEAVES (High resolution SVG vectors, soft feel) */}
          {/* Branch Top Right: Accent Green & Accent Mint gradient */}
          <div className="absolute top-[8%] right-[4%] md:right-[6%] w-20 h-20 md:w-28 md:h-28 opacity-65 z-10 animate-float-slow select-none pointer-events-none">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 10 C80 20, 60 10, 50 25 C45 32, 48 45, 40 50 C30 55, 10 40, 5 60 C0 80, 20 90, 40 85 C60 80, 70 60, 80 40 C90 20, 95 15, 100 10 Z" fill="url(#leaf-brand-grad-new)" />
              <path d="M100 10 C70 40, 40 60, 40 85" className="stroke-white/30 stroke-[1]" />
              <defs>
                <linearGradient id="leaf-brand-grad-new" x1="100%" y1="10%" x2="0%" y2="90%">
                  <stop offset="0%" stopColor="#8FE3B0" />
                  <stop offset="60%" stopColor="#6FD4C5" />
                  <stop offset="100%" stopColor="#CFF7DF" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Center-left Soft Leaf Drifter */}
          <div className="absolute top-[42%] left-[6%] md:left-[14%] w-10 h-10 md:w-14 md:h-14 opacity-50 z-10 animate-float-medium select-none pointer-events-none">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-[15deg]">
              <path d="M15,90 C35,75 55,70 65,50 C75,30 65,10 85,5 C70,25 55,45 35,55 C15,65 10,80 15,90 Z" fill="url(#leaf-drifter-new-1)" />
              <path d="M15,90 C45,65 65,35 85,5" className="stroke-white/40 stroke-[1.2]" />
              <defs>
                <linearGradient id="leaf-drifter-new-1" x1="15%" y1="90%" x2="85%" y2="5%">
                  <stop offset="0%" stopColor="#6FD4C5" />
                  <stop offset="100%" stopColor="#CFF7DF" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Lower Right Soft Leaf */}
          <div className="absolute bottom-[24%] right-[10%] md:right-[18%] w-8 h-8 md:w-11 md:h-11 opacity-55 z-10 animate-float-slow select-none pointer-events-none">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-[35deg]">
              <path d="M10,85 C25,60 45,55 55,35 C65,15 55,5 75,0 C65,20 50,35 35,45 C20,55 10,75 10,85 Z" fill="url(#leaf-drifter-new-2)" />
              <path d="M10,85 C35,55 55,25 75,0" className="stroke-white/30 stroke-[1]" />
              <defs>
                <linearGradient id="leaf-drifter-new-2" x1="10%" y1="85%" x2="75%" y2="0%">
                  <stop offset="0%" stopColor="#8FE3B0" />
                  <stop offset="100%" stopColor="#CFF7DF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* HERO LEFT (CONTENT) */}
            <div className="lg:col-span-6 text-left space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0D9488]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="tracking-wide uppercase font-mono text-[10px]">Universal Commerce Layer</span>
              </div>
              
              <h1 className="font-display font-black text-5xl sm:text-6.5xl text-slate-900 tracking-tighter leading-[1.05]">
                Shop smarter. <span className="text-gradient-primary">Buy greener.</span>
              </h1>
              
              <p className="text-slate-645 text-base sm:text-lg max-w-2xl leading-relaxed">
                The modern e-commerce transparency extension. EcoIntercept instantly analyzes products, identifies greenwashing risk, and suggests circular variants in real-time.
              </p>
              
              {/* HERO CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  id="hero-primary-cta"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-2.5 px-8 py-4.5 primary-btn text-white rounded-xl font-bold text-sm shadow-xl shadow-emerald-500/10 cursor-pointer disabled:opacity-90"
                >
                  {downloading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : downloadSuccess ? (
                    <CheckCheck className="w-4 h-4 text-emerald-300 animate-bounce" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  <span>
                    {downloading 
                      ? "EcoIntercept.zip Downloading..." 
                      : downloadSuccess 
                        ? "Download Started" 
                        : "Download Extension — It's Free"}
                  </span>
                </button>
                
                <button 
                  id="hero-secondary-cta"
                  onClick={() => handleScrollToSection("extension-showcase")}
                  className="inline-flex items-center gap-2.5 px-8 py-4.5 secondary-btn text-slate-800 rounded-xl font-bold text-sm cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-800" />
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* GRADING BADGES AND STARS (Fidelity to Screenshot 1) */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-1">
                  {["A", "B", "C", "D"].map((letter) => (
                    <div 
                      key={letter} 
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs select-none shadow-sm ${
                        letter === "A" ? "bg-emerald-100 text-emerald-800" :
                        letter === "B" ? "bg-emerald-50 text-emerald-700" :
                        letter === "C" ? "bg-teal-100 text-teal-800" :
                        "bg-teal-50 text-teal-700"
                      }`}
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-start justify-center">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Trusted by 50,000+ conscious shoppers</span>
                </div>
              </div>
 
              {/* FLOATING TRUST STAT */}
              <div className="flex items-center gap-6 pt-4 border-t border-slate-200 max-w-md">
                <div>
                  <div id="live-tracked-counter" className="text-2xl font-mono font-bold text-slate-900 text-gradient">
                    {productsTracked.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">Products Tracked</div>
                </div>
                <div className="border-l border-slate-205 h-8" />
                <div>
                  <div id="live-carbon-counter" className="text-2xl font-mono font-bold text-teal-600">
                    {carbonSaved.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
                  </div>
                  <div className="text-xs text-slate-500">CO2 Emissions Diverted</div>
                </div>
              </div>
            </div>

            {/* HERO RIGHT (VISUAL HERO CARD - GLASSMORPHISM MOCKUP) */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
              
              {/* Premium browser tab container */}
              <div className="relative w-full max-w-[460px] glass p-4 border-slate-200/80 shadow-2xl animate-float-slow">
                
                {/* Browser frame titlebar mocks */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/60">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 px-3 py-0.5 bg-slate-100 rounded border border-slate-200/80">
                    amazon.com/patagonia-fleece-jacket
                  </div>
                  <div className="w-4 h-4" />
                </div>

                {/* Simulated Amazon Product Details */}
                <div className="grid grid-cols-12 gap-3 mb-4 opacity-50 select-none">
                  <div className="col-span-4 aspect-square bg-slate-100 rounded-lg flex items-center justify-center text-4xl">
                    🧥
                  </div>
                  <div className="col-span-8 flex flex-col justify-center space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-11/12" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>

                {/* Extension Overlay Slide out card (The centerpiece!) */}
                <div className="glass p-5 border-slate-200/80 shadow-2xl relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2 items-center">
                      <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-md">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-display text-slate-900 uppercase tracking-wider">EcoIntercept Active</h4>
                        <p className="text-[10px] text-slate-500">Verifying Product Credentials</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 border border-emerald-200 text-emerald-800 font-mono px-2 py-0.5 rounded-full font-bold">100% Verified</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-center mb-4">
                    {/* Circle Score */}
                    <div className="col-span-1 flex flex-col items-center">
                      <div className="relative w-16 h-16 rounded-full border-4 border-emerald-500 flex flex-col justify-center items-center shadow-lg shadow-emerald-500/15">
                        <span className="text-xl font-bold text-slate-900 leading-none">92</span>
                        <span className="text-[7px] text-emerald-600 tracking-widest font-mono uppercase mt-0.5">EcoScore</span>
                      </div>
                    </div>
                    
                    {/* Key stats */}
                    <div className="col-span-2 space-y-2 text-xs">
                      <div className="flex justify-between border-b border-slate-150 pb-1">
                        <span className="text-slate-500">Carbon Impact:</span>
                        <span className="font-semibold text-emerald-600 font-mono">Low (8.5 kg)</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-150 pb-1">
                        <span className="text-slate-500">Greenwash Risk:</span>
                        <span className="font-semibold text-emerald-600 font-mono">Zero Detected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Alternatives:</span>
                        <span className="font-semibold text-teal-600 font-mono">3 Found</span>
                      </div>
                    </div>
                  </div>

                  {/* Highlights snippet */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-600">
                    <p className="font-bold text-emerald-600 mb-1 flex items-center gap-1 font-display">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Material Highlight:
                    </p>
                    Analyzed product has 100% recycled polyester fiber blends. Diverting up to 34% of traditional manufacturing heat release. Fully circular design.
                  </div>
                </div>

                {/* Floating mini element */}
                <div className="absolute -bottom-5 -right-4 glass p-4 border-slate-200/80 z-0 shadow-2xl rotate-6">
                  <div className="text-xs text-slate-500 mb-2">Weekly Savings</div>
                  <div className="text-xl font-bold text-slate-900 font-mono">-14.2kg CO2e</div>
                  <div className="mt-4 w-full h-12 bg-slate-100 rounded-md relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-emerald-500/15"></div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ================================================
          SECTION 2: SUPPORTED STORES (BRAND SHOWCASE MARQUEE)
          ================================================ */}
      <section id="trust-section" className="py-20 bg-white relative overflow-hidden isolate">
        
        {/* Variation A: White background with soft wave accents */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-white">
          <div className="absolute inset-x-0 bottom-0 h-28 overflow-hidden opacity-[0.06]">
            <svg viewBox="0 0 1440 100" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,50 C320,100 640,-10 960,70 C1120,90 1280,40 1440,60 L1440,100 L0,100 Z" fill="#8FE3B0" />
              <path d="M0,60 C400,10 800,90 1200,30 L1440,80" stroke="#6FD4C5" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="absolute inset-x-0 top-0 h-28 overflow-hidden opacity-[0.06] transform rotate-180">
            <svg viewBox="0 0 1440 100" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,50 C320,100 640,-10 960,70 C1120,90 1280,40 1440,60 L1440,100 L0,100 Z" fill="#6FD4C5" />
            </svg>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto mb-10 space-y-4">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight text-gradient">
              Works Across Your Favorite Stores
            </h2>
            <p className="text-slate-700 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              EcoIntercept AI seamlessly analyzes purchases across leading e-commerce platforms.
            </p>
          </div>

          {/* Infinite Moving Marquee Outer Container */}
          <div className="relative w-full py-4 overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-20 before:bg-gradient-to-r before:from-[#F8FAFC] before:to-transparent before:z-10 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-20 after:bg-gradient-to-l after:from-[#F8FAFC] after:to-transparent after:z-10">
            <div className="animate-marquee-continuous flex items-center gap-6 whitespace-nowrap">
              {/* Loop the items twice to ensure smooth seamless infinite loop */}
              {[1, 2].map((loopIdx) => (
                <div key={loopIdx} className="flex gap-6 items-center shrink-0">
                  {[
                    { name: "Amazon", color: "from-[#FF9900]/8 to-amber-500/[0.02] text-[#FF9900] border-amber-500/20", glyph: "⌗" },
                    { name: "Flipkart", color: "from-[#2874F0]/8 to-[#2874F0]/[0.02] text-[#2874F0] border-[#2874F0]/20", glyph: "✦" },
                    { name: "Myntra", color: "from-[#FF3F6C]/8 to-pink-500/[0.02] text-[#FF3F6C] border-pink-500/20", glyph: "❋" },
                    { name: "JioMart", color: "from-[#00529B]/8 to-[#00529B]/[0.02] text-[#00529B] border-[#00529B]/20", glyph: "🛒" },
                    { name: "Shopify", color: "from-[#95BF47]/8 to-[#7AAB1E]/[0.02] text-[#7AAB1E] border-[#95BF47]/20", glyph: "🛍️" },
                    { name: "Ajio", color: "from-[#0F172A]/8 to-slate-800/[0.02] text-[#0F172A] border-slate-300", glyph: "◈" },
                    { name: "Meesho", color: "from-[#F43F5E]/8 to-rose-500/[0.02] text-[#F43F5E] border-rose-500/20", glyph: "♥" },
                    { name: "Tata CLiQ", color: "from-[#DA251C]/8 to-red-500/[0.02] text-[#DA251C] border-red-500/20", glyph: "✸" },
                    { name: "Nykaa", color: "from-[#FC2779]/8 to-pink-600/[0.02] text-[#FC2779] border-pink-400/20", glyph: "🎀" },
                    { name: "Etsy", color: "from-[#D57200]/8 to-orange-500/[0.02] text-[#D57200] border-orange-500/20", glyph: "✿" }
                  ].map((store, itemIdx) => (
                    <div 
                      key={`${loopIdx}-${itemIdx}-${store.name}`}
                      className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border bg-gradient-to-r ${store.color} shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white cursor-default select-none`}
                    >
                      <span className="text-sm font-bold opacity-80">{store.glyph}</span>
                      <span className="font-display font-extrabold text-sm sm:text-base tracking-tight">
                        {store.name}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Quick trust metrics */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" /> Works with Shopify Stores
            </span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" /> Simple Uncompressed Code
            </span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" /> Strict Zero User Tracking
            </span>
          </div>

        </div>
      </section>

      {/* ================================================
          SECTION 3: PROBLEM
          ================================================ */}
      <section id="problem-section" className="py-28 md:py-36 bg-white relative overflow-hidden isolate">
        
        {/* Background override or default */}
        {problemBg ? (
          <div 
            className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-cover bg-center opacity-[0.09] transition-all duration-1000"
            style={{ backgroundImage: `url(${problemBg})` }}
          />
        ) : null}

        {/* White + faint blue corner glow */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-white">
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-[#F5F9FF] via-[#A8D4FF]/4 to-transparent rounded-full filter blur-[100px] opacity-90 animate-pulse-slow" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-[#F5F9FF] via-[#6FD4C5]/3 to-transparent rounded-full filter blur-[80px] opacity-70" />
          <div className="absolute top-[25%] left-[15%] w-1.5 h-1.5 bg-[#A8D4FF] rounded-full opacity-10 animate-pulse-slow" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-4xl mx-auto mb-20 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-red-600 font-bold">The Dark Side of Checkout</div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-slate-900 tracking-tighter leading-tight">
              Online Shopping Hides Environmental Costs
            </h2>
            <p className="text-slate-700 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              E-Commerce algorithms are optimized to trigger immediate impulse buys, hiding toxic petrochemical processing, microplastics release, and carbon emissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROBLEM_CARDS.map((card, i) => (
              <div 
                key={card.id} 
                className="group relative glass glass-interactive p-8 md:p-10 hover:bg-white hover:border-red-200 transition-all duration-350"
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-red-500/[0.01] opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity pointer-events-none" />
                
                <div className="relative space-y-5">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-700 group-hover:scale-105 transition-transform border border-red-100 shadow-sm">
                    {i === 0 && <Database className="w-5.5 h-5.5" />}
                    {i === 1 && <AlertTriangle className="w-5.5 h-5.5" />}
                    {i === 2 && <BarChart3 className="w-5.5 h-5.5" />}
                  </div>

                  <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 tracking-tight transition-colors group-hover:text-red-700">
                    {card.title}
                  </h3>
                  
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                    {card.description}
                  </p>
                  
                  <div className="pt-4 border-t border-slate-200/60 flex gap-2.5 items-start">
                    <span className="text-[10px] font-mono text-red-700 bg-red-50 border border-red-100/50 px-1.5 py-0.5 rounded font-black select-none">FACT</span>
                    <span className="text-xs sm:text-[13px] text-slate-600 leading-snug">{card.detail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Problem comparison footer cards */}
          <div className="mt-14 glass p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-700 items-center shadow-lg">
            <div>
              <p className="text-slate-500 uppercase tracking-widest font-mono text-[10px] mb-2 font-bold">What you are shown:</p>
              <div className="flex gap-2 flex-wrap text-xs">
                <span className="bg-red-50 border border-red-105 px-3 py-1.5 rounded-lg text-red-700 font-semibold shadow-sm">💵 Low Price Hooks</span>
                <span className="bg-red-50 border border-red-105 px-3 py-1.5 rounded-lg text-red-700 font-semibold shadow-sm">⭐️ Star Ratings</span>
                <span className="bg-red-50 border border-red-105 px-3 py-1.5 rounded-lg text-red-700 font-semibold shadow-sm">📦 Overnight Delivery</span>
              </div>
            </div>
            <div>
              <p className="text-[#0D9488] uppercase tracking-widest font-mono text-[10px] mb-2 font-black">What EcoIntercept uncovers:</p>
              <div className="flex gap-2 flex-wrap text-xs">
                <span className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg text-emerald-850 font-bold shadow-sm">🌱 Raw Sustainability Score</span>
                <span className="bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-lg text-teal-850 font-bold shadow-sm font-mono">💨 Carbon Footprint Metrics</span>
                <span className="bg-lime-50 border border-lime-100 px-3 py-1.5 rounded-lg text-lime-850 font-bold shadow-sm">🔍 Greenwashing Risks</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================================================
          SECTION 4: SOLUTION (VISUAL FLOW PIPELINE)
          ================================================ */}
      <section id="solution-flow" className="py-24 relative overflow-hidden isolate bg-[#F7FCF9]">
        
        {/* Background override or default */}
        {solutionBg ? (
          <div 
            className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-cover bg-center opacity-[0.09] transition-all duration-1000"
            style={{ backgroundImage: `url(${solutionBg})` }}
          />
        ) : null}

        {/* Light mint background with subtle glows */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-[#F7FCF9]">
          <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-[#8FE3B0]/6 rounded-full filter blur-[60px] opacity-75" />
          <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-[#CFF7DF]/8 rounded-full filter blur-[70px] opacity-80" />
          <div className="absolute top-[40%] right-[20%] w-1.5 h-1.5 bg-[#8FE3B0] rounded-full opacity-10" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-[#0D9488] font-semibold">The Antidote To Blind Purchases</div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Meet EcoIntercept AI
            </h2>
            <p className="text-slate-700 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              An intelligent, universal carbon overlay operating silently in your browser background.
            </p>
          </div>

          {/* Solution Flow steps */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
            
            {/* Visual connecting line */}
            <div className="hidden md:block absolute top-[50px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-emerald-500/10 via-[#14B8A6]/20 to-emerald-500/10 z-0" />

            {[
              { label: "Visit Product Page", desc: "Browse your favorite e-commerce platforms.", emoji: "🛒", icon: ShoppingBag },
              { label: "Analyze Product", desc: "Automated retrieval of raw materials & supply chains.", emoji: "⚡", icon: Terminal },
              { label: "Generate EcoScore", desc: "Dynamic scores from 0-100 are calculated.", emoji: "📊", icon: BarChart3 },
              { label: "Detect Greenwashing", desc: "Flags misleading text or dubious claims.", emoji: "🛡️", icon: ShieldCheck },
              { label: "Suggest Alternatives", desc: "See better, low-carbon variants.", emoji: "💡", icon: Lightbulb },
              { label: "Better Decisions", desc: "Buy with verified climate awareness.", emoji: "🌍", icon: Globe }
            ].map((step, idx) => {
              const IconComp = step.icon;
              return (
                <div 
                  key={step.label}
                  onClick={() => setActiveSolutionStep(idx)}
                  className={`relative z-10 p-4 transition-all cursor-pointer select-none group rounded-2xl ${
                    activeSolutionStep === idx 
                      ? "glass-accent shadow-lg shadow-emerald-500/[0.04]" 
                      : "glass hover:bg-white hover:shadow-md"
                  }`}
                >
                  <div className="mx-auto mb-3 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-transform group-hover:scale-105">
                    {activeSolutionStep === idx ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-50 text-[#14B8A6] flex items-center justify-center border border-slate-200/65 font-mono">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  
                  <h4 className={`text-sm font-extrabold leading-snug ${activeSolutionStep === idx ? "text-emerald-700" : "text-slate-650"}`}>
                    {step.label}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 sm:hidden md:block">Step {idx + 1}</p>
                </div>
              );
            })}
          </div>

          {/* Active Flow Step Details cards */}
          <div className="mt-8 glass p-6.5 max-w-3xl mx-auto flex gap-6 items-center flex-col md:flex-row shadow-lg border border-slate-200/60">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              {activeSolutionStep === 0 && <ShoppingBag className="w-7 h-7" />}
              {activeSolutionStep === 1 && <Terminal className="w-7 h-7" />}
              {activeSolutionStep === 2 && <BarChart3 className="w-7 h-7" />}
              {activeSolutionStep === 3 && <ShieldCheck className="w-7 h-7" />}
              {activeSolutionStep === 4 && <Lightbulb className="w-7 h-7" />}
              {activeSolutionStep === 5 && <Globe className="w-7 h-7" />}
            </div>
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-mono text-[#0D9488] uppercase tracking-widest font-black">Deep Dive: Phase {activeSolutionStep + 1}</span>
              <h3 className="font-display font-extrabold text-xl text-slate-900 leading-tight">
                {[
                  "Integrating with Checkout Views",
                  "Anonymized Scraping & Material Retrieval",
                  "AI Multi-Criteria Scoring Algorithms",
                  "Text Pattern & Certificate Audit Checks",
                  "Pioneering Regenerative Recs Engine",
                  "Guaranteed Carbon Mitigation"
                ][activeSolutionStep]}
              </h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-2xl font-normal">
                {[
                  "EcoIntercept tracks URL anchors seamlessly. When navigating into listing galleries on sites such as Amazon or Flipkart, our listener awakens to evaluate raw elements.",
                  "We fetch underlying fiber details, production grids, logistics configurations, and factory registries automatically. None of your local details are transmitted.",
                  "EcoScore compiles materials, assembly electricity grids, fair trade metrics, packaging compositions, and lifecycle estimates into a weighted score from 0 to 100.",
                  "Our language engine crawls claims for vague words like 'eco-conscious blends' without certified tracing IDs, immediately applying high-risk flags if deceptive indicators are met.",
                  "If a product contains high synthetic polymer concentrations, EcoIntercept recommends active, accessible, high-performance variants made of plant-based or organic compostable fibers.",
                  "Consumers can bypass fast-fashion chains, redirecting capital to climate-tech and circular design pioneers. Saving tons of CO2 globally inside the retail sphere."
                ][activeSolutionStep]}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ================================================
          SECTION 5: FEATURES (FIDELITY TO SCREENSHOT 2)
          ================================================ */}
      <section id="features-section" className="py-24 relative overflow-hidden isolate bg-white">
        
        {/* Variation D: White background with delicate eco-tech line patterns & soft green accents */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-white">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#EEF9F1]/40 rounded-full filter blur-[120px]" />
          
          <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="eco-grid-features" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1.2" fill="#8FE3B0" />
                <path d="M30 0 L30 60 M0 30 L60 30" stroke="#8FE3B0" strokeWidth="0.5" strokeDasharray="3 3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#eco-grid-features)" />
          </svg>
          
          <div className="absolute top-0 left-[15%] h-full w-[1px] bg-gradient-to-b from-transparent via-[#8FE3B0]/10 to-transparent" />
          <div className="absolute bottom-0 right-[20%] h-full w-[1px] bg-gradient-to-b from-transparent via-[#6FD4C5]/8 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="font-display font-extrabold text-3xl sm:text-4.5xl text-slate-900 tracking-tight text-gradient">
              Everything you need to shop sustainably
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "AI EcoScore",
                desc: "Get an instant 0-100 sustainability rating for any product you browse.",
                icon: Leaf
              },
              {
                title: "Greenwashing Detection",
                desc: "AI flags misleading eco-claims and unsubstantiated green marketing.",
                icon: ShieldCheck
              },
              {
                title: "Carbon Impact Estimation",
                desc: "See estimated carbon footprint before you add to cart.",
                icon: Globe
              },
              {
                title: "Better Alternatives",
                desc: "Discover greener products with higher scores and lower impact.",
                icon: Lightbulb
              },
              {
                title: "Track Your Impact",
                desc: "Monitor your sustainable purchases and environmental savings over time.",
                icon: BarChart3
              }
            ].map((feature, idx, arr) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={feature.title}
                  className={`glass p-8 hover:bg-white hover:border-emerald-500/20 hover:shadow-xl transition-all duration-300 ${
                    idx === arr.length - 1 ? "md:col-span-1" : ""
                  }`}
                >
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                      <IconComponent className="w-5.5 h-5.5" />
                    </div>
                  </div>
                  
                  <h3 className="font-display font-bold text-slate-900 text-lg mb-3">{feature.title}</h3>
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ================================================
          SECTION 6.5: EDUCATIONAL AWARENESS SECTION (UNVEILING THE HIDDEN COSTS)
          ================================================ */}
      <section id="educational-awareness" className="py-24 bg-white relative overflow-hidden isolate">
        
        {/* Variation A: White background with soft wave accents */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-white">
          <div className="absolute inset-x-0 bottom-0 h-28 overflow-hidden opacity-[0.06]">
            <svg viewBox="0 0 1440 100" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,50 C320,100 640,-10 960,70 C1120,90 1280,40 1440,60 L1440,100 L0,100 Z" fill="#6FD4C5" />
              <path d="M0,40 C300,90 700,20 1100,80 L1440,50" stroke="#8FE3B0" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="absolute inset-x-0 top-0 h-28 overflow-hidden opacity-[0.05] transform rotate-180">
            <svg viewBox="0 0 1440 100" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,50 C320,100 640,-10 960,70 C1120,90 1280,40 1440,60 L1440,100 L0,100 Z" fill="#8FE3B0" />
            </svg>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header section with required typography */}
          <div className="text-center max-w-4xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-200/50 text-amber-800 text-[10px] uppercase font-mono tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Environmental Awareness Insight
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-slate-900 tracking-tight leading-tight">
              Online Shopping Hides Environmental Costs
            </h2>
            <p className="text-slate-700 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
              E-commerce platforms are designed for convenience and impulse buying. Most shoppers never see the carbon emissions, packaging waste, and environmental impact created by each purchase. <span className="text-emerald-700 font-bold font-display">EcoIntercept AI</span> reveals those hidden costs before you check out.
            </p>
          </div>

          {/* Interactive Showcase Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            
            {/* Left selector col - 4/12 */}
            <div className="lg:col-span-4 flex flex-col justify-center space-y-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Select a Standard Cart Item</span>
              
              <div className="space-y-3">
                {[
                  {
                    id: "fleece",
                    title: "The Fast Fashion Fleece",
                    category: "POLYMER TEXTILES",
                    emoji: "🧥",
                    color: "border-emerald-500/25 text-emerald-700 bg-emerald-50/20"
                  },
                  {
                    id: "tech",
                    title: "The Upgraded Smartphone",
                    category: "CONSUMER ELECTRONICS",
                    emoji: "📱",
                    color: "border-sky-500/25 text-sky-700 bg-sky-50/20"
                  },
                  {
                    id: "shoes",
                    title: "Synthetically Dyed Sneakers",
                    category: "ATHLETIC SPORTSWEAR",
                    emoji: "👟",
                    color: "border-amber-500/25 text-amber-700 bg-amber-50/20"
                  }
                ].map((item) => {
                  const isActive = selectedEduProduct === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedEduProduct(item.id)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 group ${
                        isActive 
                          ? "bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/20" 
                          : "bg-white/40 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform duration-300 ${
                        isActive ? "scale-110 rotate-3 bg-emerald-500/10" : "bg-slate-100 group-hover:scale-105"
                      }`}>
                        {item.emoji}
                      </div>
                      <div className="flex-1">
                        <span className="block text-[8px] font-mono text-slate-500 tracking-wider uppercase font-semibold">{item.category}</span>
                        <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base leading-snug">{item.title}</h4>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        isActive ? "bg-emerald-500 border-transparent text-white" : "border-slate-200 text-slate-400 group-hover:border-slate-350"
                      }`}>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic educational tip badge */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-[11px] text-slate-500 flex items-start gap-2">
                <span className="text-amber-500 text-sm font-bold mt-0.5">ℹ</span>
                <p>Click on any product above to visualize the invisible carbon ledger that our extension reveals before checkout.</p>
              </div>

            </div>

            {/* Right presentation col - 8/12 */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Card A: Convenience Facade (Traditional storefront sight) */}
              <motion.div 
                key={`traditional-${selectedEduProduct}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-7 border-slate-200/80 rounded-3xl flex flex-col justify-between space-y-6 relative overflow-hidden"
              >
                {/* Decorative facade shine */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-300/10 to-transparent rounded-bl-full pointer-events-none" />
                
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[9px] font-mono tracking-widest text-blue-600 font-bold uppercase bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                      Standard Retailer View
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Designed to convert</span>
                  </div>

                  <h4 className="font-display font-extrabold text-xl text-slate-900 mb-2">
                    {selectedEduProduct === "fleece" && "Recycled Retro Snap Fleece"}
                    {selectedEduProduct === "tech" && "Titanium Infinite Phone"}
                    {selectedEduProduct === "shoes" && "Air cushion Eco Runner"}
                  </h4>

                  {/* Simulated stars */}
                  <div className="flex items-center gap-1.5 mb-6">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {selectedEduProduct === "fleece" && "4.8 ★ (12,410 Reviews)"}
                      {selectedEduProduct === "tech" && "4.9 ★ (8,901 Reviews)"}
                      {selectedEduProduct === "shoes" && "4.7 ★ (412 Reviews)"}
                    </span>
                  </div>

                  {/* Standard details */}
                  <div className="space-y-3.5 text-xs text-slate-650">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Cart Price:</span>
                      <span className="font-bold text-slate-900">
                        {selectedEduProduct === "fleece" && "$49.99"}
                        {selectedEduProduct === "tech" && "$999.00"}
                        {selectedEduProduct === "shoes" && "$120.00"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Logistics Speed:</span>
                      <span className="font-bold text-blue-600 flex items-center gap-1">
                        ⚡ Free Next-Day shipping
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Checkout State:</span>
                      <span className="text-slate-500 text-[11px]">Invisible sustainability metrics</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed italic bg-slate-50/50 p-3 rounded-xl">
                  {selectedEduProduct === "fleece" && "“Looks premium and feels incredibly soft. Ideal for modern urban travel and camping.”"}
                  {selectedEduProduct === "tech" && "“The camera is flawless. High-speed transfers make content creation smoother than ever.”"}
                  {selectedEduProduct === "shoes" && "“Feather-light sole. Great color matching for responsive casual athletic training.”"}
                </div>
              </motion.div>

              {/* Card B: What Actually Happens (Revealed Carbon Ledger) */}
              <motion.div 
                key={`intercept-${selectedEduProduct}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="border-2 border-emerald-500/30 bg-gradient-to-b from-white to-emerald-50/[0.04] p-7 rounded-3xl flex flex-col justify-between space-y-6 relative overflow-hidden shadow-lg shadow-emerald-500/[0.02]"
              >
                {/* Brand glow overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[9px] font-mono tracking-widest text-[#0D9488] font-black uppercase bg-[#0D9488]/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                      EcoIntercept AI layer
                    </span>
                    <span className="text-xs text-[#0D9488] font-bold font-mono">Unveiling Truth</span>
                  </div>

                  <h4 className="font-display font-extrabold text-xl text-slate-900 mb-2 flex items-center gap-2">
                    <LogoIcon className="w-5.5 h-5.5" />
                    Real Environmental Toll
                  </h4>

                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 rounded-md font-bold uppercase">
                      Classified Footprint High
                    </span>
                  </div>

                  {/* Hidden costs breakdown */}
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between border-b border-emerald-100/50 pb-2">
                      <span className="text-slate-500 font-medium">Carbon Expense:</span>
                      <span className="font-bold text-red-600 font-mono text-sm">
                        {selectedEduProduct === "fleece" && "32.4 kg CO₂e"}
                        {selectedEduProduct === "tech" && "79.2 kg CO₂e"}
                        {selectedEduProduct === "shoes" && "14.8 kg CO₂e"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-100/50 pb-2">
                      <span className="text-slate-500 font-medium">Chemical Degradation:</span>
                      <span className="font-bold text-slate-900">
                        {selectedEduProduct === "fleece" && "8,200L Dye Runoff"}
                        {selectedEduProduct === "tech" && "E-Waste Ore Sludge"}
                        {selectedEduProduct === "shoes" && "Petro-adhesive Leach"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Synthetic Byproducts:</span>
                      <span className="font-bold text-slate-800">
                        {selectedEduProduct === "fleece" && "250g Microplastics"}
                        {selectedEduProduct === "tech" && "180g Mining Tailings"}
                        {selectedEduProduct === "shoes" && "400yr Landfill Decay"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-emerald-100 text-[11px] text-slate-650 leading-relaxed bg-emerald-500/5 p-4 rounded-xl relative">
                  <p className="font-semibold text-emerald-800 font-display mb-1">EcoIntercept Intelligence Insight:</p>
                  <p>
                    {selectedEduProduct === "fleece" && "Polyester utilizes petroleum oil extraction. EcoIntercept will recommend plant-based tencel alternatives saving up to 74% carbon."}
                    {selectedEduProduct === "tech" && "Silica purification grids utilize heavy cleanroom thermal ovens. Recommending verified refurbished editions saving almost 60kg emission burdens."}
                    {selectedEduProduct === "shoes" && "Synthetic footwear binders use high-toxic vulcanization glues. Recommending circular canvas shoes with natural organic rubber soles."}
                  </p>
                </div>
              </motion.div>

            </div>

          </div>

        </div>
      </section>

      {/* ================================================
          SECTION 7: EXTENSION SHOWCASE / INTERACTIVE PLAYGROUND (THE HERO FEATURE)
          ================================================ */}
      <section id="extension-showcase" className="py-24 bg-gradient-to-tr from-[#F7FCF9] via-[#FFFFFF] to-[#EEF9F1] relative overflow-hidden isolate">
        
        {/* Background override or default */}
        {showcaseBg ? (
          <div 
            className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-cover bg-center opacity-[0.09] transition-all duration-1000"
            style={{ backgroundImage: `url(${showcaseBg})` }}
          />
        ) : null}

        {/* Light mint gradient background with soft depth particles */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-gradient-to-tr from-[#F7FCF9] via-[#FFFFFF] to-[#EEF9F1]">
          <div className="absolute top-[10%] left-[5%] w-[220px] h-[220px] bg-[#8FE3B0]/6 rounded-full filter blur-[60px] opacity-75" />
          <div className="absolute bottom-[10%] right-[3%] w-[250px] h-[250px] bg-[#6FD4C5]/5 rounded-full filter blur-[70px] opacity-60" />
          <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 bg-[#8FE3B0] rounded-full opacity-10 animate-pulse-slow" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-[#0D9488] font-semibold">Try the Extension Live</div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Interactive Sustainability Simulator
            </h2>
            <p className="text-slate-700 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Choose an ecommerce catalog item below or enter any custom product to analyze it using real server-side Gemini intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            
            {/* LEFT SIDE: SELECT PRODUCT / INPUT SEARCH */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              
              {/* Product catalog presets */}
              <div className="space-y-4">
                <span className="text-xs font-mono text-slate-500 uppercase block tracking-wider">Select Preset Product</span>
                <div className="grid grid-cols-2 gap-3">
                  {DEMO_PRODUCTS.map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => handleSelectPreset(demo.id, demo.placeholderName)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedProductId === demo.id
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-md font-bold"
                          : "bg-white border-slate-105 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm cursor-pointer"
                      }`}
                    >
                      <div className="text-2xl mb-2">{demo.emoji}</div>
                      <div className="text-sm font-extrabold font-display truncate text-slate-900">{demo.name}</div>
                      <div className="text-[11px] text-slate-600 truncate font-semibold">{demo.category}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input Analysis (Gemini-powered real search) */}
              <div className="glass p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900 font-display">Analyze Custom Item</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  Type any real-world product (e.g. "Patagonia Fleece", "H&M polyester t-shirt", "Nestle water bottle", "Organic linen shirt") to fetch raw eco intelligence.
                </p>
                
                <form onSubmit={handleCustomSearchSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder="Enter brand & product..."
                    className="flex-1 bg-white border border-slate-205 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 primary-btn font-bold text-xs rounded-lg disabled:opacity-50 transition-all shrink-0 cursor-pointer text-white"
                  >
                    {loading ? "Hold on..." : "Analyze"}
                  </button>
                </form>
              </div>

              {/* Mini instructions block */}
              <div className="space-y-2">
                <div className="flex gap-2 items-start text-xs sm:text-sm text-slate-600">
                  <Info className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
                  <span>
                    When running on dev keys, this module queries live **Gemini-3.5-flash** schema pipelines. In sandboxes, it gracefully simulates premium scores.
                  </span>
                </div>
              </div>

            </div>

            {/* RIGHT SIDE: INTERACTIVE EXTENSION PANEL CONTAINER */}
            <div className="lg:col-span-7 flex justify-center">
              
              {/* Device browser viewport mockup */}
              <div className="w-full max-w-[450px] glass overflow-hidden flex flex-col shadow-2xl border-slate-200/80">
                
                {/* Browser Title mock */}
                <div className="bg-slate-50 px-4 py-3 flex items-center gap-2 border-b border-slate-200/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="mx-auto text-[10px] font-mono text-slate-500 bg-slate-100 px-3 py-0.5 rounded border border-slate-200/80 flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5 text-slate-400" />
                    <span>e-store.com/catalog/view</span>
                  </div>
                  <div className="w-10 h-1" />
                </div>

                {/* Simulated Webpage body with injected active extension sidebar */}
                <div className="flex-1 p-4 grid grid-cols-12 gap-4 items-stretch relative min-h-[480px]">
                  
                  {/* Web Page Content blur-fade (represents product page under overlay) */}
                  <div className="col-span-12 opacity-15 pointer-events-none select-none space-y-4">
                    <div className="h-6 bg-slate-400 rounded w-1/3" />
                    <div className="aspect-video bg-slate-300 rounded-lg" />
                    <div className="space-y-2">
                       <div className="h-3 bg-slate-300 rounded w-full" />
                       <div className="h-3 bg-slate-300 rounded w-11/12" />
                       <div className="h-3 bg-slate-300 rounded w-2/3" />
                    </div>
                  </div>

                  {/* Active Slide-in Side Panel (The Extension Popup) */}
                  <div className="absolute top-2 right-2 bottom-2 w-[340px] glass p-4 flex flex-col justify-between overflow-y-auto z-10 shadow-2xl border-slate-200/80">
                    
                    {/* Panel Header */}
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center">
                          <span className="font-display font-black text-white text-xs">EI</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 font-display">EcoIntercept AI</h4>
                          <span className="block text-[8px] font-mono text-emerald-600 font-bold">Verifying Product...</span>
                        </div>
                      </div>
                      
                      <span className="text-[8px] font-mono bg-slate-150 border border-slate-200/60 px-2 py-0.5 rounded text-slate-600 uppercase tracking-widest leading-none font-bold">v1.0.0</span>
                    </div>

                    {/* Loader */}
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div 
                          key="loader"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex-1 flex flex-col items-center justify-center py-12 space-y-4 text-center"
                        >
                          <RefreshCw className="w-8 h-8 text-[#0D9488] animate-spin" />
                          <div>
                            <p className="text-xs font-semibold text-slate-900">Invoking Climate Audit Engine</p>
                            <p className="text-[10px] text-slate-500 mt-1">Analyzing supply carbon metrics...</p>
                          </div>
                        </motion.div>
                      ) : error ? (
                        <motion.div 
                          key="error"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-2"
                        >
                          <AlertTriangle className="w-8 h-8 text-rose-500" />
                          <p className="text-xs font-bold text-slate-800">{error}</p>
                          <button 
                            onClick={() => fetchProductDetails("patagonia synchilla fleece")} 
                            className="text-[10px] text-emerald-600 font-bold hover:underline"
                          >
                            Reset To Patagonia Default
                          </button>
                        </motion.div>
                      ) : activeAnalysis ? (
                        <motion.div 
                          key="content"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex-1 flex flex-col justify-between space-y-3 text-xs"
                        >
                          
                          {/* Circle EcoScore display */}
                          <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-150">
                            <div className={`w-14 h-14 rounded-full border-4 ${getScoreColor(activeAnalysis.ecoScore).border} flex flex-col justify-center items-center shrink-0 ${getScoreColor(activeAnalysis.ecoScore).glow} shadow-lg shadow-emerald-500/10`}>
                              <span className="text-lg font-bold text-slate-900 leading-none">{activeAnalysis.ecoScore}</span>
                              <span className="text-[6px] text-slate-550 font-mono tracking-widest uppercase mt-0.5">Eco</span>
                            </div>
                            
                            <div className="space-y-1">
                              <h5 className="font-bold text-slate-900 leading-tight truncate max-w-[190px]">{activeAnalysis.productName}</h5>
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded leading-none font-mono">
                                  Score: {activeAnalysis.ecoScore}/100
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded leading-none font-semibold ${getRiskBadgeColor(activeAnalysis.greenwashingRisk)}`}>
                                  Greenwash: {activeAnalysis.greenwashingRisk}
                                </span>
                                {activeAnalysis.isSandbox && (
                                  <span className="text-[9px] bg-amber-500/15 border border-amber-500/30 text-amber-800 px-1.5 py-0.5 rounded leading-none font-semibold animate-pulse">
                                    Simulating Sandbox Mode
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* High-impact Metrics metrics */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                              <span className="block text-[8px] uppercase tracking-wider text-slate-500 mb-0.5 font-bold">Carbon Impact</span>
                              <span className="font-mono font-bold text-slate-805 text-xs">{activeAnalysis.carbonKg} kg CO2e</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                              <span className="block text-[8px] uppercase tracking-wider text-slate-500 mb-0.5 font-bold">Assigned Class</span>
                              <span className="font-mono font-bold text-slate-805 text-xs">{activeAnalysis.carbonLevel} carbon footprint</span>
                            </div>
                          </div>

                          {/* Greenwashing Details alert */}
                          <div className={`p-2.5 rounded-lg text-[10px] leading-relaxed border ${
                            activeAnalysis.greenwashingRisk === "High" 
                              ? "bg-rose-50 text-rose-850 border-rose-105" 
                              : "bg-emerald-50 text-emerald-850 border-emerald-105"
                          }`}>
                            <div className="font-bold mb-1 flex items-center gap-1">
                              {activeAnalysis.greenwashingRisk === "High" ? (
                                <BadgeAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              ) : (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                              <span>Greenwashing Audit Indicator:</span>
                            </div>
                            {activeAnalysis.greenwashingDetails}
                          </div>

                          {/* Highlights carousel list */}
                          <div className="space-y-1">
                            <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1 font-bold">Environmental Highlights</span>
                            <div className="space-y-1">
                              {activeAnalysis.highlights.slice(0, 3).map((hl, i) => (
                                <div key={i} className="flex gap-1.5 items-start text-[10px] text-slate-600">
                                  <CheckCheck className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                  <span className="truncate">{hl}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Eco alternatives widget */}
                          <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60">
                            <span className="block text-[8px] font-mono text-[#0D9488] uppercase tracking-widest font-bold">Suggested Green Alternatives</span>
                            <div className="space-y-1.5">
                              {activeAnalysis.alternatives.map((alt) => (
                                <div 
                                  key={alt.name}
                                  onClick={() => fetchProductDetails(alt.name)} 
                                  className="group/alt bg-white p-2 rounded-lg border border-slate-150 hover:border-emerald-350 transition-all cursor-pointer flex justify-between items-center gap-2"
                                >
                                  <div className="min-w-0">
                                    <div className="font-display font-semibold text-slate-800 truncate group-hover/alt:text-emerald-700 text-[10px]">{alt.name}</div>
                                    <div className="text-[8px] text-slate-500">{alt.brand} • {alt.carbonKg}kg CO2e</div>
                                  </div>
                                  <div className={`text-[10px] font-bold ${getScoreColor(alt.ecoScore).text} bg-slate-50 border border-slate-150 px-2 py-0.5 rounded font-mono`}>
                                    Score: {alt.ecoScore}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    {/* Footer callout */}
                    <div className="mt-3 pt-2 border-t border-slate-200/60 text-center">
                      <button 
                        onClick={handleDownload}
                        className="w-full primary-btn font-bold text-[10px] py-2 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer text-white"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download Extension ZIP</span>
                      </button>
                    </div>

                  </div>

                </div>

              </div>
              
            </div>

          </div>

        </div>
      </section>

      {/* ================================================
          SECTION 6: HOW IT WORKS SECTION (VIBRANT CHROMIUM GUIDE)
          ================================================ */}
      <section id="installation-guide" className="py-24 relative overflow-hidden isolate bg-white">
        
        {/* White clean background */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-white" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-[#0D9488] font-semibold">Developer Unpacked Installation</div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Simple 6-Step Installation Guide
            </h2>
            <p className="text-slate-700 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Load our raw unpackaged extension directory on Google Chrome in less than 60 seconds without complex keys or stores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEP_GUIDES.map((step) => (
              <div 
                key={step.number}
                className="glass p-5 relative space-y-3 hover:bg-white hover:shadow-md transition-all duration-300"
              >
                <div className="flex justify-between items-center">
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-[#0D9488] flex items-center justify-center font-mono font-bold text-xs border border-teal-200/50">
                    0{step.number}
                  </div>
                  {step.codeSnippet && (
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded leading-none font-bold">
                      {step.codeSnippet}
                    </span>
                  )}
                </div>
                
                <h3 className="font-display font-semibold text-slate-900 text-base">{step.title}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{step.description}</p>
                
                {step.number === 1 && (
                  <button 
                    onClick={handleDownload}
                    className="mt-2 w-full secondary-btn text-slate-800 font-bold text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer font-display"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Package</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Quick Chrome Warning terminal badge */}
          <div className="mt-10 glass p-4 max-w-2xl mx-auto flex gap-3 text-xs items-center bg-slate-50 border-slate-200">
            <Terminal className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-slate-750 font-mono text-xs">
              <span className="text-emerald-700 font-bold">env_log //</span> EcoIntercept Chrome Extension conforms strictly to Chromium Manifest V3 rules. Completely lightweight and secure.
            </span>
          </div>

        </div>
      </section>

      {/* ================================================
          SECTION 8: IMPACT SECTION
          ================================================ */}
      <section id="impact-section" className="py-24 relative overflow-hidden isolate bg-white">
        
        {/* Background override or default */}
        {impactBg ? (
          <div 
            className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-cover bg-center opacity-[0.09] transition-all duration-1000"
            style={{ backgroundImage: `url(${impactBg})` }}
          />
        ) : null}

        {/* Soft blue-green glow */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-white">
          <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-[#F3FCFC] rounded-full filter blur-[100px] opacity-90 animate-pulse-slow" />
          <div className="absolute bottom-[10%] right-[3%] w-[450px] h-[450px] bg-[#EEF9F1] rounded-full filter blur-[110px] opacity-85" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-tr from-[#6FD4C5]/5 to-[#8FE3B0]/5 rounded-full filter blur-[70px] opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-[#0D9488] font-semibold">Collective Global Progress</div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Our Tracked Environmental Savings
            </h2>
            <p className="text-slate-700 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Each product swapped for a regenerative circular alternative cuts down petrochemical heat and toxicity factors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div 
                key={stat.label}
                className="glass p-6 md:text-center space-y-2 relative overflow-hidden hover:bg-white hover:shadow-lg transition-all duration-300"
              >
                <div className="absolute top-0 left-0 w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                
                <h3 className="font-mono font-extrabold text-3xl text-slate-950">
                  {i === 0 ? productsTracked.toLocaleString() : i === 1 ? `${carbonSaved.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}t` : stat.value}
                </h3>
                
                <h4 className="font-display font-extrabold text-xs sm:text-sm text-emerald-800 uppercase tracking-wider">{stat.label}</h4>
                <p className="text-xs sm:text-sm text-slate-705 leading-relaxed">{stat.subtext}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================================================
          SECTION 9: COMPARE ROW TABLE
          ================================================ */}
      <section id="compare-section" className="py-24 relative overflow-hidden isolate bg-white">
        
        {/* Variation A: White background with soft wave accents */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-white">
          <div className="absolute inset-x-0 bottom-0 h-28 overflow-hidden opacity-[0.06]">
            <svg viewBox="0 0 1440 100" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,50 C320,100 640,-10 960,70 C1120,90 1280,40 1440,60 L1440,100 L0,100 Z" fill="#8FE3B0" />
              <path d="M0,60 C400,10 800,90 1200,30 L1440,80" stroke="#6FD4C5" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="absolute inset-x-0 top-0 h-28 overflow-hidden opacity-[0.05] transform rotate-180">
            <svg viewBox="0 0 1440 100" fill="none" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,50 C320,100 640,-10 960,70 C1120,90 1280,40 1440,60 L1440,100 L0,100 Z" fill="#6FD4C5" />
            </svg>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-[#0D9488] font-semibold">Structural Paradigm Shift</div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Traditional VS EcoIntercept Shopping
            </h2>
            <p className="text-slate-700 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              See how integrating an environmental intelligence layer directly changes our purchasing metrics.
            </p>
          </div>

          <div className="glass overflow-hidden max-w-4xl mx-auto shadow-xl border-slate-200/80">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/60 font-mono uppercase text-[10px] tracking-widest text-teal-700">
                  <th className="p-4">Utility Attribute</th>
                  <th className="p-4 text-slate-600">Traditional Checkout</th>
                  <th className="p-4 text-emerald-800 bg-emerald-500/[0.04] border-x border-slate-200/60 font-bold">EcoIntercept AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {COMPARISONS.map((row) => (
                  <tr key={row.metric} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{row.metric}</td>
                    <td className="p-4 text-slate-700 font-normal">{row.traditional}</td>
                    <td className="p-4 text-emerald-900 font-bold bg-emerald-500/[0.04] border-x border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <CheckCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{row.ecoIntercept}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* ================================================
          SECTION 9B: THE FUTURE OF CONSCIOUS SHOPPING
          ================================================ */}
      <section className="py-24 bg-[#F7FCF9] relative overflow-hidden isolate">
        
        {/* Variation B: Very light mint tint with minimal particles */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-[#F7FCF9]">
          <div className="absolute top-[20%] left-[10%] w-[150px] h-[150px] bg-[#8FE3B0]/5 rounded-full filter blur-[40px]" />
          <div className="absolute bottom-[20%] right-[10%] w-[200px] h-[200px] bg-[#CFF7DF]/5 rounded-full filter blur-[50px]" />
          <div className="absolute top-[30%] right-[15%] w-1.5 h-1.5 bg-[#8FE3B0] rounded-full opacity-10 animate-pulse-slow" />
          <div className="absolute bottom-[40%] left-[12%] w-[5px] h-[5px] bg-[#6FD4C5] rounded-full opacity-10 filter blur-[0.5px]" />
          <div className="absolute top-[70%] left-[25%] text-[#8FE3B0] text-[8px] opacity-[0.08] animate-pulse-slow">✦</div>
          <div className="absolute top-[60%] right-[8%] text-[#6FD4C5] text-[12px] opacity-[0.06]">✦</div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="font-display font-extrabold text-3xl sm:text-4.5xl text-slate-900 tracking-tight text-gradient">
              The future of conscious shopping
            </h2>
            <p className="text-slate-705 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              We bridge the gap between intent and action, turning blind purchases into certified carbon offsets.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch max-w-5xl mx-auto relative">
            
            {/* Center Decorative Leaf Connector */}
            <div className="hidden lg:flex absolute left-1/2 top-11 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-slate-200/80 shadow-md flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-500 animate-pulse" />
            </div>

            {/* WITHOUT ECOINTERCEPT */}
            <div className="glass p-8 border border-red-100 bg-white/40 rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-lg">Without EcoIntercept</h3>
                    <p className="text-[11px] text-slate-500 font-mono tracking-wider font-semibold">BLIND PURCHASING PARADIGM</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {[
                    "Price, ratings, and reviews are your only guide when comparing products.",
                    "Highly susceptible to deceptive greenwashing claims and vague buzzwords.",
                    "Completely blind to the true carbon footprint and lifecycle impact of your cart.",
                    "Extremely difficult to discover or compare genuine sustainable alternatives."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-3 text-left">
                      <div className="w-5.5 h-5.5 rounded-full bg-red-50/80 flex items-center justify-center border border-red-100 text-red-650 mt-0.5 shrink-0 flex-none select-none">
                        <span className="text-xs font-bold leading-none">×</span>
                      </div>
                      <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-slate-150">
                <span className="text-xs font-mono font-medium text-red-600 bg-red-50/50 px-2.5 py-1 rounded-md">Blind Buying Process</span>
              </div>
            </div>

            {/* WITH ECOINTERCEPT */}
            <div className="glass p-8 border border-emerald-250 bg-emerald-500/[0.01] rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-lg">With EcoIntercept</h3>
                    <p className="text-[11px] text-emerald-650 font-mono tracking-wider font-semibold">CONSCIOUS INTELLIGENCE LAYER</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {[
                    "Instant AI EcoScores from 0 to 100 injected directly onto your product viewport.",
                    "Continuous real-time verification filters out dubious and misleading claims.",
                    "Clear, transparent estimated carbon emissions displayed upfront as you browse.",
                    "Intelligent, contextual suggestions highlight greener, verified variants instantly."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-3 text-left">
                      <div className="w-5.5 h-5.5 rounded-full bg-emerald-50/85 flex items-center justify-center border border-emerald-100 text-emerald-650 mt-0.5 shrink-0 flex-none animate-pulse-slow">
                        <CheckCheck className="w-3.5 h-3.5 animate-pulse-slow" />
                      </div>
                      <p className="text-slate-850 text-sm sm:text-base leading-relaxed font-extrabold">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-emerald-100/60">
                <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">Regenerative Shopping Flow</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================================================
          SECTION 10: FAQ SECTION
          ================================================ */}
      <section id="faq-section" className="py-24 relative overflow-hidden isolate bg-white">
        
        {/* Variation C: White background with soft blue gradient corner glow */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-white">
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-[#F5F9FF] via-[#A8D4FF]/4 to-transparent rounded-full filter blur-[100px] opacity-90" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-[#F5F9FF] via-[#6FD4C5]/3 to-transparent rounded-full filter blur-[80px] opacity-70" />
          <div className="absolute top-[20%] left-[12%] w-1.5 h-1.5 bg-[#A8D4FF] rounded-full opacity-10 animate-pulse-slow" />
          <div className="absolute bottom-[30%] right-[12%] w-1.5 h-1.5 bg-[#6FD4C5] rounded-full opacity-[0.08]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-[#0D9488] font-semibold">Frequently Asked Questions</div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Sustainability Clearance Hub
            </h2>
            <p className="text-slate-700 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Clarify your operational and data queries regarding how EcoIntercept processes metrics.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {FAQS.map((faq, idx) => (
              <div 
                key={idx} 
                className="glass rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-5 flex justify-between items-center gap-4 text-sm font-semibold text-slate-900 hover:text-emerald-700 focus:outline-none"
                >
                  <span className="font-display">{faq.question}</span>
                  <span className={`w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-mono text-xs text-slate-500 transform transition-transform duration-200 ${activeFaq === idx ? "rotate-90 text-emerald-600 font-bold" : ""}`}>
                    {activeFaq === idx ? "−" : "+"}
                  </span>
                </button>
                
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 pt-1 text-slate-700 leading-normal text-sm sm:text-base border-t border-slate-150 bg-slate-50/20">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================================================
          SECTION 11: FINAL CTA
          ================================================ */}
      <section id="final-cta" className="py-24 bg-gradient-to-t from-emerald-50 to-transparent relative overflow-hidden">
        
        {/* Glow behind */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 glass text-xs text-emerald-700 font-mono rounded-full font-bold">
            <span>Ready for Instant Deployment</span>
          </div>
          
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900 tracking-tight leading-none max-w-2xl mx-auto">
            Start Shopping Sustainably Today
          </h2>
          
          <p className="text-slate-700 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Download EcoIntercept AI and make informed purchasing decisions. Bypassing synthetic greenwashing has never been more fluid.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button 
              id="cta-primary-btn"
              onClick={handleDownload}
              className="inline-flex items-center gap-2.5 px-8 py-4 primary-btn text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Extension</span>
            </button>
            
            <button 
              id="cta-secondary-btn"
              onClick={() => handleScrollToSection("installation-guide")}
              className="inline-flex items-center gap-2.5 px-8 py-4 secondary-btn text-slate-850 rounded-xl font-bold text-sm cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>Installation Guide</span>
            </button>
          </div>

          <div className="pt-6 text-[10px] text-slate-500 font-mono">
            EcoIntercept AI © 2026 • 100% Secure • ZIP Contains Inline Fully Verified Javascript Code
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* BRAND */}
            <div className="space-y-4 col-span-1 md:col-span-2">
              <div className="flex items-center gap-3">
                <LogoIcon className="w-9 h-9" />
                <div>
                  <span className="font-display font-bold text-base text-slate-900 tracking-tight">EcoIntercept<span className="text-[#0B7A4C]">.ai</span></span>
                  <span className="block text-[7px] font-sans tracking-[0.22em] text-[#0B7A4C] uppercase font-bold leading-none mt-0.5 whitespace-nowrap">Sustainability Intelligence</span>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 max-w-sm">
                A universal carbon footprints lookup table and greenwash protection plugin operating natively within the digital purchasing architecture.
              </p>
              <p className="text-[10px] text-slate-500">
                Helping modern shoppers make circular, ethical buying decisions across the globe. Powered by advanced Gemini AI algorithms.
              </p>
            </div>

            {/* LINKS COL 1 */}
            <div className="space-y-3">
              <h5 className="font-display font-semibold text-slate-900 text-[11px] uppercase tracking-widest text-teal-700 font-bold">Navigation</h5>
              <ul className="space-y-2 text-[11px] text-slate-600">
                <li><button onClick={() => handleScrollToSection("problem-section")} className="hover:text-emerald-700 transition-colors">The Problem</button></li>
                <li><button onClick={() => handleScrollToSection("solution-flow")} className="hover:text-emerald-700 transition-colors">Operational Solution</button></li>
                <li><button onClick={() => handleScrollToSection("features-section")} className="hover:text-emerald-700 transition-colors">Core Features</button></li>
                <li><button onClick={() => handleScrollToSection("installation-guide")} className="hover:text-emerald-700 transition-colors">Unpacked Loading</button></li>
              </ul>
            </div>

            {/* LINKS COL 2 */}
            <div className="space-y-3">
              <h5 className="font-display font-semibold text-slate-900 text-[11px] uppercase tracking-widest text-teal-700 font-bold">Resources</h5>
              <ul className="space-y-2 text-[11px] text-slate-600">
                <li><button onClick={() => handleScrollToSection("faq-section")} className="hover:text-emerald-700 transition-colors">FAQ Registry</button></li>
                <li><a href="#" className="hover:text-emerald-700 transition-colors">Privacy Charter</a></li>
                <li><a href="#" className="hover:text-emerald-700 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-emerald-700 transition-colors">GitHub Repository</a></li>
                <li><a href="#" className="hover:text-emerald-700 transition-colors">Audit Methodology</a></li>
              </ul>
            </div>

          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 text-center flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500">
            <div>
              EcoIntercept AI © 2026. Made with carbon-neutral design guidelines.
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-emerald-700 transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-emerald-700 transition-colors">Sitemap</a>
              <span>•</span>
              <a href="#" className="hover:text-emerald-750" style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                <span>Certified Climate Solution</span> <Heart className="w-2.5 h-2.5 fill-current text-rose-505" />
              </a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
