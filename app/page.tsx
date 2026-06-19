"use strict";

"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scan, Sparkles, BrainCircuit, ShieldCheck, ArrowLeft,
  Target, Zap, Maximize, Smartphone, Cpu, FileText,
  Lock, EyeOff, Upload, CheckCircle2, Info, Sun, Moon, Activity
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import Scanner from "@/components/Scanner";
import AnalysisResults from "@/components/AnalysisResults";
import { cn } from "@/lib/utils";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const sections = ["hero", "features", "how-it-works", "privacy"];
    const observers = sections.map(id => {
      const element = document.getElementById(id);
      if (!element) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        {
          threshold: 0.1,
          rootMargin: "-20% 0px -70% 0px"
        }
      );

      observer.observe(element);
      return observer;
    });

    return () => {
      observers.forEach(observer => observer?.disconnect());
    };
  }, []);

  const handleScan = async (image: string, localResults?: any) => {
    setIsProcessing(true);
    setHasScanned(true);

    // Initial results from local analysis
    if (localResults) {
      setResults({
        score: localResults.score,
        title: "Analyzing Structure...",
        tierMeaning: "Calculating aesthetic geometry...",
        summary: "Live spatial mapping complete. Synchronizing with neural processing...",
        confidenceScore: 92,
        metrics: [
          { label: "Jawline Definition", value: localResults.jawlineDefinition > 80 ? "Sharp" : "Soft", numericalValue: `${Math.round(localResults.jawlineDefinition)}%`, score: Math.round(localResults.jawlineDefinition), percentile: 72, coords: { x: 50, y: 85 } },
          { label: "Eye Symmetry", value: localResults.symmetry > 95 ? "High" : "Average", numericalValue: `${Math.round(localResults.symmetry)}%`, score: Math.round(localResults.symmetry), percentile: 88, coords: { x: 50, y: 35 } },
          { label: "Canthal Tilt", value: localResults.canthalTilt > 0 ? "Positive" : "Neutral", numericalValue: `${localResults.canthalTilt.toFixed(1)}°`, score: 75 + localResults.canthalTilt * 2, percentile: 65, coords: { x: 35, y: 35 } },
          { label: "Mid-face Ratio", value: localResults.midFaceRatio.toFixed(2), numericalValue: localResults.midFaceRatio.toFixed(2), score: 85, percentile: 78, coords: { x: 50, y: 55 } },
        ],
        pros: ["Strong spatial symmetry detected", "Defined facial thirds"],
        cons: ["Processing deeper neural insights..."],
        capturedImage: image,
        isMock: true
      });
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, localResults }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setResults({ ...data, capturedImage: image });
    } catch (err) {
      console.error(err);
      alert("Something went wrong with the analysis.");
      setHasScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const scrollToScanner = () => {
    scannerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const reset = () => {
    setHasScanned(false);
    setResults(null);
    setIsProcessing(false);
  };

  return (
    <main className="min-h-screen bg-background text-foreground relative selection:bg-primary/30">
      {/* Background Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/5 blur-[120px] rounded-full -z-10 opacity-50 dark:opacity-100" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 dark:bg-accent/5 blur-[120px] rounded-full -z-10 opacity-50 dark:opacity-100" />

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl bg-background/80 border-b border-foreground/5 py-4 transition-all duration-300">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={reset}>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <Scan className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">LOOK<span className="text-primary uppercase">Max</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-black">
            <a
              href="#features"
              className={cn(
                "transition-all duration-300 hover:text-primary",
                activeSection === "features" ? "text-primary scale-110" : "text-foreground/40 dark:text-white/40"
              )}
            >
              Technology
            </a>
            <a
              href="#how-it-works"
              className={cn(
                "transition-all duration-300 hover:text-primary",
                activeSection === "how-it-works" ? "text-primary scale-110" : "text-foreground/40 dark:text-white/40"
              )}
            >
              Methodology
            </a>
            <a
              href="#privacy"
              className={cn(
                "transition-all duration-300 hover:text-primary",
                activeSection === "privacy" ? "text-primary scale-110" : "text-foreground/40 dark:text-white/40"
              )}
            >
              Privacy
            </a>
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-foreground/5 dark:bg-white/5 rounded-full hover:bg-foreground/10 dark:hover:bg-white/10 transition-colors border border-foreground/10 dark:border-white/10 text-foreground dark:text-white flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={scrollToScanner}
              className="px-5 py-2.5 bg-foreground/5 dark:bg-white/5 rounded-full hover:bg-foreground/10 dark:hover:bg-white/10 transition-colors border border-foreground/10 dark:border-white/10 text-foreground dark:text-white"
            >
              Analyze Now
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 pt-12 pb-24">
        <AnimatePresence mode="wait">
          {!hasScanned ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-32"
            >
              {/* Hero Section */}
              <section id="hero" className="text-center max-w-4xl mx-auto space-y-10 pt-10 scroll-mt-32">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4"
                >
                  <Sparkles size={14} /> Professional Facial Intelligence
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.05]"
                >
                  Analyze Your Face <br />
                  <span className="bg-gradient-to-r from-primary via-accent to-blue-400 bg-clip-text text-transparent italic">Like a Pro</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-foreground/50 dark:text-white/50 max-w-2xl mx-auto leading-relaxed"
                >
                  Get a scientific breakdown of your facial structure — symmetry, proportions, strengths, and improvement areas.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                >
                  <button
                    onClick={scrollToScanner}
                    className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-2xl font-bold text-lg glow-box hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    <Scan size={20} /> Start Live Scan
                  </button>
                  <button
                    onClick={scrollToScanner}
                    className="w-full sm:w-auto px-10 py-5 bg-foreground/5 dark:bg-white/5 text-foreground dark:text-white border border-foreground/10 dark:border-white/10 rounded-2xl font-bold text-lg hover:bg-foreground/10 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload size={20} /> Upload for Analysis
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-foreground/30 dark:text-white/30 font-medium tracking-wide">
                    Instant results • No signup required
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-foreground/20 dark:text-white/20 uppercase tracking-widest font-bold">
                    <CheckCircle2 size={12} className="text-primary" />
                    Used for personal improvement, grooming, and self-analysis
                  </div>
                </motion.div>
              </section>

              {/* Scanner Section */}
              <section ref={scannerRef} className="scroll-mt-32">
                <Scanner onScan={handleScan} isProcessing={isProcessing} />
              </section>

              {/* Result Preview Section */}
              <section className="space-y-12 max-w-6xl mx-auto">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-bold text-foreground">What You’ll Discover</h2>
                  <p className="text-foreground/40 max-w-xl mx-auto">
                    Our AI maps your unique markers to provide a high-fidelity structural report.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Mock Result Card 1 */}
                  <div className="glass-card p-6 space-y-4 border-primary/20 bg-primary/5 dark:bg-primary/5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">Symmetry</span>
                      <span className="text-2xl font-bold">8.4<span className="text-xs text-foreground/20 dark:text-white/20">/10</span></span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-foreground/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[84%]" />
                      </div>
                      <p className="text-xs text-foreground/40 dark:text-white/40">Near-perfect horizontal alignment detected.</p>
                    </div>
                  </div>
                  {/* Mock Result Card 2 */}
                  <div className="glass-card p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-widest text-foreground/40 dark:text-white/40">Proportions</span>
                      <span className="text-2xl font-bold">7.2<span className="text-xs text-foreground/20 dark:text-white/20">/10</span></span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-foreground/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-foreground/20 dark:bg-white/20 w-[72%]" />
                      </div>
                      <p className="text-xs text-foreground/40 dark:text-white/40">Standard vertical thirds ratio.</p>
                    </div>
                  </div>
                  {/* Mock Result Card 3 */}
                  <div className="glass-card p-6 space-y-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-foreground/40 dark:text-white/40 mb-2">Key Insights</div>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-green-600 dark:text-green-400/80">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                        <span>Strong defined jawline structure</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400/80">
                        <Info size={14} className="mt-0.5 shrink-0" />
                        <span>Minor canthal tilt asymmetry</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Features Section */}
              <section id="features" className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto scroll-mt-32">
                {[
                  {
                    icon: BrainCircuit,
                    title: "Facial Structure Analysis",
                    desc: "Detects face shape, bone structure, and proportions using AI."
                  },
                  {
                    icon: Target,
                    title: "Strengths & Weakness Detection",
                    desc: "Identifies what enhances your appearance and what holds it back."
                  },
                  {
                    icon: Zap,
                    title: "Actionable Improvements",
                    desc: "Suggestions for grooming, hairstyle, posture, and presentation."
                  },
                  {
                    icon: Maximize,
                    title: "Real-Time + Upload Modes",
                    desc: "Analyze instantly or upload photos anytime."
                  }
                ].map((feature, i) => (
                  <div key={i} className="glass-card p-8 group hover:bg-primary/5 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                      <feature.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-foreground/40 dark:text-white/40 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </section>

              {/* How It Works Section */}
              <section id="how-it-works" className="space-y-16 py-12">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-bold">How It Works</h2>
                  <p className="text-foreground/40 dark:text-white/40">Sophisticated analysis in three simple steps.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
                  {/* Progress line */}
                  <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-foreground/10 dark:via-white/10 to-transparent -z-10" />
                  {[
                    { step: "01", icon: Smartphone, title: "Scan or Upload", desc: "Use your camera for a live scan or upload a clear portrait." },
                    { step: "02", icon: Cpu, title: "AI Maps Your Face", desc: "Our neural network detects 128+ structural landmarks." },
                    { step: "03", icon: FileText, title: "Get Detailed Breakdown", desc: "Receive a professional report on your facial metrics." }
                  ].map((item, i) => (
                    <div key={i} className="text-center space-y-6">
                      <div className="relative mx-auto w-24 h-24 rounded-full bg-background border border-foreground/10 dark:border-white/10 flex items-center justify-center text-primary group hover:border-primary/50 transition-all">
                        <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-primary text-white px-2 py-1 rounded-full">{item.step}</span>
                        <item.icon size={32} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">{item.title}</h3>
                        <p className="text-sm text-foreground/40 dark:text-white/40 leading-relaxed px-4">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Privacy Section */}
              <section id="privacy" className="max-w-4xl mx-auto scroll-mt-32">
                <div className="glass-card p-12 text-center space-y-8 bg-gradient-to-b from-foreground/[0.02] dark:from-white/[0.02] to-transparent">
                  <div className="flex justify-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Lock size={28} />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <ShieldCheck size={28} />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-blue-400/10 flex items-center justify-center text-blue-400">
                      <EyeOff size={28} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold">Your Privacy is Mandatory</h2>
                    <p className="text-foreground/50 dark:text-white/50 max-w-md mx-auto leading-relaxed">
                      Your images are processed securely in real-time and items are never stored on our servers.
                      Photos are not saved and so don't want be deleted.
                      Complete encryption for every analysis.
                    </p>
                  </div>
                </div>
              </section>

              {/* Final CTA Section */}
              <section className="text-center space-y-10 py-20 pb-40">
                <h2 className="text-5xl font-bold tracking-tight">Ready to Understand Your Face?</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={scrollToScanner}
                    className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-2xl font-bold text-lg glow-box hover:scale-105 transition-all"
                  >
                    Start Live Scan
                  </button>
                  <button
                    onClick={scrollToScanner}
                    className="w-full sm:w-auto px-10 py-5 bg-foreground/5 dark:bg-white/5 text-foreground dark:text-white border border-foreground/10 dark:border-white/10 rounded-2xl font-bold text-lg hover:bg-foreground/10 dark:hover:bg-white/10 transition-all"
                  >
                    Upload Photo
                  </button>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between max-w-4xl mx-auto mb-4">
                <button
                  onClick={reset}
                  className="flex items-center gap-2 text-foreground/40 dark:text-white/40 hover:text-primary transition-colors group"
                >
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  New Analysis
                </button>
                <div className="text-xs text-foreground/20 dark:text-white/20 uppercase tracking-widest font-bold">Report Generated</div>
              </div>

              {isProcessing ? (
                <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center gap-12 p-6">
                  <div className="absolute inset-0 bg-primary/5 animate-pulse-slow -z-10" />

                  <div className="relative w-48 h-48">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/20"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-2 rounded-full border-4 border-t-primary border-r-primary/30 border-b-transparent border-l-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-transparent border-b-accent border-l-accent/30"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BrainCircuit className="text-primary animate-pulse" size={48} />
                    </div>
                  </div>

                  <div className="text-center space-y-6 max-w-md">
                    <div className="space-y-2">
                      <h3 className="text-4xl font-black tracking-tighter glow-text uppercase">Neural Processing</h3>
                      <p className="text-foreground/40 dark:text-white/40 text-xs font-bold tracking-[0.4em] uppercase">Deep Structural Analysis In Progress</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-8 border-t border-foreground/5 dark:border-white/5">
                      <div className="space-y-1">
                        <div className="text-[10px] text-foreground/20 dark:text-white/20 font-black uppercase tracking-widest">Symmetry Engaged</div>
                        <div className="h-1 w-full bg-foreground/5 dark:bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary"
                            animate={{ width: ["0%", "100%", "40%", "90%"] }}
                            transition={{ duration: 10, repeat: Infinity }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-foreground/20 dark:text-white/20 font-black uppercase tracking-widest">Ratio Compiling</div>
                        <div className="h-1 w-full bg-foreground/5 dark:bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-accent"
                            animate={{ width: ["0%", "70%", "20%", "100%"] }}
                            transition={{ duration: 8, repeat: Infinity }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-primary/60 text-[10px] font-mono animate-pulse tracking-tighter pt-4">
                      {">"} MAP_LANDMARKS... CALCULATING_SYMMETRY... EVALUATING_PROPORTIONS...
                    </p>
                  </div>
                </div>
              ) : (
                results && <AnalysisResults results={results} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="py-12 border-t border-foreground/5 dark:border-white/5 text-center space-y-4">
        <div className="text-lg font-bold tracking-tight text-foreground/20 dark:text-white/20 uppercase">LOOK<span className="text-primary/20">Max</span></div>
        <p className="text-foreground/10 dark:text-white/10 text-[10px] uppercase tracking-[0.4em] font-bold">
          Scientific Structural Intelligence • © 2026
        </p>
      </footer>
    </main>
  );
}
