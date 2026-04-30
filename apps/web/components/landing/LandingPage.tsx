"use client";

import Hero from "./Hero";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import Stats from "./Stats";
import CTA from "./CTA";
import FAQ from "./FAQ";
import Navigation from "./Navigation";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Navigation />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <FAQ />
      <CTA />
    </div>
  );
}
