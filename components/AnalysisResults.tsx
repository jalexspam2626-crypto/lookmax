"use strict";

"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Award, TrendingUp, Info, Activity, Target, ShieldCheck, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { motion, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Metric {
    label: string;
    value: string;
    numericalValue: string;
    score: number;
    percentile: number;
    coords: { x: number; y: number };
}

interface AnalysisResultsProps {
    results: {
        score: number;
        title: string;
        tierMeaning: string;
        metrics: Metric[];
        pros: string[];
        cons: string[];
        summary: string;
        confidenceScore: number;
        capturedImage?: string;
        error?: string;
        details?: string;
        isMock?: boolean;
    };
}

const METRIC_DEFINITIONS: Record<string, string> = {
    "Jawline Definition": "How sharp and visible your jawline looks from the front and side.",
    "Eye Symmetry": "How well-aligned and similar your left and right eyes look.",
    "Canthal Tilt": "Whether the outer corners of your eyes tilt upwards or downwards.",
    "Mid-face Ratio": "The balance between the width of your cheekbones and the length of your mid-face.",
    "Chin Projection": "How much your chin stands out or sits back relative to your face.",
    "Brow Ridge": "The prominence of the bone right above your eyebrows.",
    "Lip Fullness": "How thick and voluminous your upper and lower lips look.",
    "Nose Projection": "How far your nose sticks out from your face.",
};

const RECOMMENDATIONS: Record<string, { category: string; tips: string[] }> = {
    "Jawline Definition": {
        category: "Habits & Shape",
        tips: ["Practice proper tongue posture (Mewing) to define the jaw area.", "Keep body fat at a healthy, low level to make bone structure visible.", "Include harder foods in your diet to engage jaw muscles naturally."]
    },
    "Eye Symmetry": {
        category: "Daily Routine",
        tips: ["Sleep on your back to avoid putting pressure on one side of your face.", "Consciously relax facial muscles to reduce tension-led asymmetry.", "Ensure even lighting during photos to minimize shadow-based asymmetry."]
    },
    "Canthal Tilt": {
        category: "Grooming",
        tips: ["Shape your eyebrows with a slight upward arch for a lifted look.", "Use cold compresses to reduce puffiness around the outer eye corners.", "Ensure consistent sleep schedules to prevent eyelid droopiness."]
    },
    "Mid-face Ratio": {
        category: "Presentation",
        tips: ["Choose hairstyles that add volume to the sides to balance face width.", "Focus on cheekbone-defining exercises or facial massages.", "Use a slight upward tilt when posing for photos."]
    },
    "Chin Projection": {
        category: "Posture",
        tips: ["Keep your shoulders back and head level for better profile projection.", "Avoid 'tech-neck' by keeping your phone/monitor at eye level.", "Maintain proper bite alignment by visiting a dental professional."]
    }
};

export default function AnalysisResults({ results }: AnalysisResultsProps) {
    const [displayScore, setDisplayScore] = useState(0);
    const [hoveredMetricIndex, setHoveredMetricIndex] = useState<number | null>(null);
    const [hoveredInfoIndex, setHoveredInfoIndex] = useState<number | null>(null);
    const [isStrategyExpanded, setIsStrategyExpanded] = useState(false);

    useEffect(() => {
        const controls = animate(0, results.score, {
            duration: 2,
            ease: "easeOut",
            onUpdate: (value) => setDisplayScore(Math.round(value)),
        });
        return () => controls.stop();
    }, [results.score]);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-10 pb-32">
            {results.error && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex gap-4 text-red-400 text-sm backdrop-blur-md"
                >
                    <AlertCircle className="shrink-0" size={24} />
                    <div>
                        <p className="font-bold text-base">Structural Analysis Warning: {results.error}</p>
                        {results.details && <p className="opacity-70 mt-1 font-mono text-[11px] leading-relaxed uppercase tracking-tighter">{results.details}</p>}
                        <p className="mt-3 text-foreground/30 italic text-[11px] font-medium tracking-wide">
                            The system has encountered a processing bottleneck. Showing fallback structural data.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Header Score section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-10 flex flex-col md:flex-row items-center gap-12 border-primary/20 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -z-10" />

                <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="88"
                            cy="88"
                            r="82"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-foreground/5 dark:text-white/5"
                        />
                        <motion.circle
                            cx="88"
                            cy="88"
                            r="82"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={515}
                            initial={{ strokeDashoffset: 515 }}
                            animate={{ strokeDashoffset: 515 - (515 * results.score) / 100 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span className="text-6xl font-black glow-text tracking-tighter">
                            {displayScore}
                        </motion.span>
                        <span className="text-[10px] text-foreground/30 uppercase font-black tracking-[0.3em] mt-1">Intelligence</span>
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <div className="px-3 py-1 bg-primary text-foreground text-[10px] font-black uppercase tracking-widest rounded-md">
                            Neural Tier
                        </div>
                        <div className="h-px w-12 bg-foreground/10 dark:bg-white/10" />
                        <span className="text-foreground/40 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                            <Activity size={14} /> Confidence: {results.confidenceScore}%
                        </span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-foreground to-foreground/60 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                        {results.title}
                    </h2>
                    <div className="space-y-2">
                        <p className="text-foreground/80 text-sm font-bold uppercase tracking-widest">
                            {results.tierMeaning}
                        </p>
                        <p className="text-foreground/50 text-lg leading-relaxed italic font-medium max-w-xl">
                            "{results.summary}"
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Face Map Visualization */}
            {results.capturedImage && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-center w-full"
                >
                    <div className="glass-card p-4 overflow-hidden relative group aspect-[4/3] bg-black border-primary/20 w-full max-w-3xl mx-auto">
                        <img
                            src={results.capturedImage}
                            alt="Analyzed Face"
                            className="w-full h-full object-cover grayscale opacity-60 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                        {/* Interactive Landmark Overlay */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {results.metrics.map((metric, i) => (
                                <g key={i}>
                                    <motion.circle
                                        cx={metric.coords.x}
                                        cy={metric.coords.y}
                                        r={hoveredMetricIndex === i ? 3 : 1.5}
                                        fill="var(--primary)"
                                        className="drop-shadow-[0_0_8px_var(--primary)]"
                                        animate={{
                                            r: hoveredMetricIndex === i ? [3, 4, 3] : 1.5,
                                            opacity: hoveredMetricIndex === i ? 1 : 0.6
                                        }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                    />
                                </g>
                            ))}
                        </svg>

                        <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Spatial Mapping</span>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Metrics Grid */}
                <div className="md:col-span-2 space-y-8">
                    <div className="glass-card p-8 border-foreground/5 bg-gradient-to-br from-foreground/[0.03] dark:from-white/[0.03] to-transparent">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3 text-foreground/40">
                            <Target size={18} className="text-primary" /> Structural Metrics
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                            {results.metrics.map((metric, i) => (
                                <motion.div
                                    key={metric.label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    onMouseEnter={() => setHoveredMetricIndex(i)}
                                    onMouseLeave={() => setHoveredMetricIndex(null)}
                                    className={cn(
                                        "space-y-3 group p-4 rounded-2xl transition-all cursor-crosshair border border-transparent",
                                        hoveredMetricIndex === i ? "bg-primary/[0.08] border-primary/20 scale-105" : "hover:bg-foreground/5"
                                    )}
                                >
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-0.5 relative">
                                            <div className="flex items-center gap-1.5 group/info">
                                                <span className="text-sm font-black uppercase tracking-[0.1em] text-foreground/80 group-hover:text-primary transition-colors">{metric.label}</span>
                                                <div
                                                    onMouseEnter={() => setHoveredInfoIndex(i)}
                                                    onMouseLeave={() => setHoveredInfoIndex(null)}
                                                    className="p-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-help"
                                                >
                                                    <Info size={12} className="text-foreground/30 group-hover/info:text-primary transition-colors" />
                                                </div>

                                                <AnimatePresence>
                                                    {hoveredInfoIndex === i && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                            className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-background/95 backdrop-blur-md border border-primary/20 rounded-xl shadow-xl z-50 pointer-events-none"
                                                        >
                                                            <p className="text-[10px] font-bold text-foreground/80 leading-relaxed uppercase tracking-tight">
                                                                {METRIC_DEFINITIONS[metric.label] || "Neural interpretation of structural data points."}
                                                            </p>
                                                            <div className="absolute top-full left-4 w-2 h-2 bg-background border-r border-b border-primary/20 rotate-45 -mt-1" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <div className="text-xs font-bold text-foreground/90 flex items-center gap-2 mt-0.5">
                                                {metric.numericalValue}
                                                <span className="text-[10px] text-foreground/40 font-medium">({metric.value})</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-primary">{metric.score}</div>
                                            <div className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">Score</div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden p-[1px] border border-foreground/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${metric.score}%` }}
                                            transition={{ duration: 1.5, delay: 0.8 + i * 0.1, ease: "circOut" }}
                                            className="h-full bg-primary rounded-full relative"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                                        </motion.div>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                                        <span className="text-primary">{metric.percentile}th Percentile</span>
                                        <span className="text-foreground/20">Confidence: 98.4%</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-8 border-foreground/10 bg-primary/[0.02]">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3 text-foreground/40">
                            <Info size={18} className="text-primary" /> Neural Insights
                        </h3>
                        <p className="text-foreground/60 text-sm leading-relaxed font-medium">
                            Structural data integration confirms an optimal {results.metrics[0].label.toLowerCase()} configuration.
                            AI modeling suggests enhancing lateral definition through targeted grooming or posture adjustments.
                            The current {results.metrics[1].label.toLowerCase()} demonstrates high aesthetic percentile scores.
                        </p>
                    </div>
                </div>

                {/* Strengths & Optimization */}
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-8 border-emerald-500/20 bg-emerald-500/[0.02]"
                    >
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-6 text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 size={18} /> Strengths
                        </h3>
                        <ul className="space-y-4">
                            {results.pros.map((pro, i) => (
                                <li key={i} className="text-sm text-foreground/70 flex gap-3 group">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                    <span className="font-medium">{pro}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card p-8 border-primary/20 bg-primary/[0.02]"
                    >
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-6 text-primary flex items-center gap-2">
                            <Zap size={18} /> Immediate Actions
                        </h3>
                        <ul className="space-y-4">
                            {results.cons.map((con, i) => (
                                <li key={i} className="text-sm text-foreground/70 flex gap-3 group">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                    <span className="font-medium">{con}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <div className="glass-card p-6 border-foreground/5 flex flex-col items-center justify-center text-center space-y-4">
                        <ShieldCheck className="text-foreground/20" size={32} />
                        <p className="text-[10px] text-foreground/20 font-black uppercase tracking-[0.2em] leading-tight">
                            Identity Proteced<br />Processing Encrypted
                        </p>
                    </div>
                </div>
            </div>

            {/* Improvement Strategy Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card border-primary/20 bg-primary/[0.03] overflow-hidden"
            >
                <button
                    onClick={() => setIsStrategyExpanded(!isStrategyExpanded)}
                    className="w-full p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-primary/[0.05] transition-colors"
                >
                    <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                            <Zap size={16} /> Roadmap to Optimization
                        </div>
                        <h3 className="text-3xl font-black tracking-tight flex items-center gap-4">
                            Personalized Glow-up Strategy
                            {isStrategyExpanded ? <ChevronUp className="text-primary" size={24} /> : <ChevronDown className="text-primary" size={24} />}
                        </h3>
                    </div>
                    <div className="px-6 py-3 bg-primary text-foreground font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        {isStrategyExpanded ? "Viewing Action Plan" : "Reveal Action Plan"}
                    </div>
                </button>

                <AnimatePresence>
                    {isStrategyExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                        >
                            <div className="px-10 pb-10 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {results.metrics
                                        .filter(m => m.score < 88)
                                        .slice(0, 3)
                                        .map((metric, i) => {
                                            const rec = RECOMMENDATIONS[metric.label];
                                            if (!rec) return null;
                                            return (
                                                <div key={i} className="space-y-6 p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/5">
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-foreground/30">{rec.category}</div>
                                                        <div className="text-lg font-black text-foreground">Target: {metric.label}</div>
                                                    </div>
                                                    <ul className="space-y-4">
                                                        {rec.tips.map((tip, idx) => (
                                                            <li key={idx} className="flex gap-3 text-sm text-foreground/60 leading-relaxed group">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                                                                <span>{tip}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            );
                                        })}
                                </div>

                                <div className="pt-8 border-t border-foreground/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4 text-foreground/40 text-xs font-medium italic">
                                        <Info size={14} className="text-primary" />
                                        Recommendations are based on geometric symmetry and average aesthetic proportions.
                                    </div>
                                    <button className="px-8 py-4 bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 rounded-2xl text-sm font-black uppercase tracking-widest transition-all">
                                        Download Full Report
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
