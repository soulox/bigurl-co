import Link from "next/link";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does BigURL work?",
    answer:
      "BigURL takes your long URLs and creates short, memorable links. When someone clicks your short link, they're instantly redirected to the original URL. We track every click with detailed analytics.",
  },
  {
    question: "What analytics do you provide?",
    answer:
      "We track clicks, referrers, geographic location (country/city), device types, browsers, operating systems, and more. You can see all this data in your dashboard.",
  },
  {
    question: "Can I customize my short links?",
    answer:
      "Yes! You can create custom slugs (e.g., bigurl.co/my-link) instead of random codes. Custom slugs are available on all plans.",
  },
  {
    question: "How many links can I create?",
    answer:
      "Free plan: 5 links, Basic plan: 20 links, Pro plan: 100 links. You can upgrade anytime if you need more capacity.",
  },
  {
    question: "Do links expire?",
    answer:
      "Links don't expire by default. However, you can optionally set an expiration date or maximum click count when creating a link.",
  },
  {
    question: "Can I edit links after creating them?",
    answer:
      "Yes! You can update the destination URL, title, description, expiration date, and maximum clicks from your dashboard.",
  },
  {
    question: "What are QR codes?",
    answer:
      "QR codes are scannable barcodes that link to your shortened URL. Perfect for print materials, posters, or anywhere someone can scan with their phone.",
  },
  {
    question: "Can I delete links?",
    answer:
      "Absolutely. You can delete individual links or bulk delete multiple links at once from your dashboard.",
  },
  {
    question: "How do I upgrade my plan?",
    answer:
      "Go to your dashboard settings and select the plan you want. The change takes effect immediately.",
  },
  {
    question: "What happens if I downgrade?",
    answer:
      "If you have more links than your new plan allows, you'll need to delete some links before downgrading. Your data is never deleted automatically.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "Since we offer a generous free plan to try the service, paid plans are generally non-refundable. Contact us if you have concerns.",
  },
  {
    question: "How secure are my links?",
    answer:
      "All links are served over HTTPS with SSL encryption. Your data is stored securely, and we never share your analytics with third parties.",
  },
  {
    question: "Can I use BigURL for commercial purposes?",
    answer:
      "Yes! All plans, including the free tier, can be used for commercial purposes.",
  },
  {
    question: "Do you have an API?",
    answer:
      "API access is included with the Pro plan. You can programmatically create, update, and manage links.",
  },
  {
    question: "What if I need more than 100 links?",
    answer:
      "Contact us! We offer custom enterprise plans for high-volume users.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-white"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BigURL
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/pricing"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Everything you need to know about BigURL
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
            >
              <summary className="flex justify-between items-center cursor-pointer font-semibold text-lg">
                <span>{faq.question}</span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
          <p className="mb-6 opacity-90">We're here to help! Get in touch with our team.</p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Contact Us
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 BigURL. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                Pricing
              </Link>
              <Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

