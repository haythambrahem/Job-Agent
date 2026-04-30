"use client";

import Hero from "./Hero";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import PricingSection from "./Pricing";
import Testimonials from "./Testimonials";
import FAQ from "./FAQ";
import Navigation from "./Navigation";
import FinalCTA from "./FinalCTA";
import GradientBackground from "./GradientBackground";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <GradientBackground />
      <div className="relative z-10">
        <Navigation />
        <Hero />
        <Features />
        <HowItWorks />
        <PricingSection />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </div>
    </div>
  );
}
