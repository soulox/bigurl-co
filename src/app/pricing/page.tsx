"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Check, Zap } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out BigURL",
    features: [
      "5 short links",
      "QR code generation",
      "Basic analytics",
      "Custom slugs",
      "Link expiration",
      "Click tracking",
    ],
    cta: "Get Started",
    popular: false,
    gradient: "from-gray-500 to-gray-600",
  },
  {
    name: "Basic",
    price: "$9",
    period: "/ month",
    description: "For individuals and small projects",
    features: [
      "20 short links",
      "QR code generation",
      "Advanced analytics",
      "Custom slugs",
      "Link expiration",
      "Click tracking",
      "Geo-location data",
      "Device analytics",
    ],
    cta: "Upgrade to Basic",
    popular: true,
    gradient: "from-blue-500 to-purple-600",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ month",
    description: "For businesses and power users",
    features: [
      "100 short links",
      "QR code generation",
      "Advanced analytics",
      "Custom slugs",
      "Link expiration",
      "Click tracking",
      "Geo-location data",
      "Device analytics",
      "Priority support",
      "API access",
    ],
    cta: "Upgrade to Pro",
    popular: false,
    gradient: "from-purple-500 to-pink-600",
  },
];

export default function PricingPage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number } | null>(null);

  const handleUpgrade = (planName: string, price: number) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      // Redirect to sign in if not logged in
      window.location.href = "/auth/signin?mode=signup";
      return;
    }

    setSelectedPlan({ name: planName.toLowerCase(), price: parseInt(price.replace("$", "")) });
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />

      {selectedPlan && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          packageName={selectedPlan.name}
          packagePrice={selectedPlan.price}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Simple, Transparent
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 ${
                plan.popular
                  ? "border-blue-500 dark:border-blue-400"
                  : "border-gray-200 dark:border-gray-700"
              } p-8 ${plan.popular ? "transform scale-105" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center flex-shrink-0`}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.name === "Free" ? (
                <Link
                  href="/auth/signin?mode=signup"
                  className="block w-full py-3 rounded-lg font-semibold text-center transition-all shadow-lg hover:shadow-xl transform hover:scale-105 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.name, plan.price)}
                  className={`block w-full py-3 rounded-lg font-semibold text-center transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <summary className="font-semibold cursor-pointer">Can I change plans anytime?</summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time from your dashboard.
              </p>
            </details>
            <details className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <summary className="font-semibold cursor-pointer">What happens if I exceed my link limit?</summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                You'll need to upgrade your plan or delete some existing links before creating new ones.
              </p>
            </details>
            <details className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <summary className="font-semibold cursor-pointer">Do my links expire?</summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Links don't expire unless you set a custom expiration date. You can set optional expiration dates for any link.
              </p>
            </details>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

