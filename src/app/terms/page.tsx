import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header showGetStarted={false} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 sm:p-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Last updated: November 4, 2025
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Agreement to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                By accessing and using BigURL, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Description of Service</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                BigURL provides a URL shortening service that allows you to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Create shortened URLs from long links</li>
                <li>Generate QR codes for your links</li>
                <li>Track analytics and click data</li>
                <li>Customize short URLs with custom slugs</li>
                <li>Manage and organize your links</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">User Accounts</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Account Creation</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                You must create an account to use BigURL. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Account Termination</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We reserve the right to suspend or terminate your account if you violate these terms or engage in fraudulent or abusive behavior.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Subscription Plans</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Pricing</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li><strong>Free Plan:</strong> $0/month - 5 links</li>
                <li><strong>Basic Plan:</strong> $9/month - 20 links</li>
                <li><strong>Pro Plan:</strong> $29/month - 100 links</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Billing</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Paid subscriptions are billed monthly. You will be charged at the beginning of each billing cycle. All payments are processed securely through Authorize.Net.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Refunds</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We offer a generous free tier to try our service. Due to this, paid subscriptions are generally non-refundable. If you believe you're entitled to a refund, please contact our support team.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Cancellation</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                You may cancel your subscription at any time from your account settings. Your service will continue until the end of your current billing period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Acceptable Use</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                You agree NOT to use BigURL to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Create links to illegal, harmful, or offensive content</li>
                <li>Distribute malware, viruses, or malicious code</li>
                <li>Engage in phishing, scams, or fraudulent activities</li>
                <li>Spam or send unsolicited communications</li>
                <li>Violate any intellectual property rights</li>
                <li>Bypass any security features of the service</li>
                <li>Create links that violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Link Ownership and Control</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                You retain ownership of the content you link to. BigURL does not claim any ownership rights to your original URLs or content. However, we reserve the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Disable or remove links that violate these terms</li>
                <li>Suspend accounts engaged in abusive behavior</li>
                <li>Monitor links for compliance with our policies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Service Availability</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                While we strive for 99.9% uptime, we do not guarantee that BigURL will be available at all times. We may perform maintenance, updates, or experience technical difficulties. We are not liable for any damages resulting from service interruptions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Intellectual Property</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                The BigURL service, including its design, code, logo, and documentation, is owned by BigURL and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute our intellectual property without permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                BigURL is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service. Our total liability shall not exceed the amount you paid us in the past 12 months.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Indemnification</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                You agree to indemnify and hold BigURL harmless from any claims, damages, or expenses arising from your use of the service, your violation of these terms, or your violation of any rights of another.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Modifications to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the service. Continued use of BigURL after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Governing Law</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                For questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none space-y-2 text-gray-700 dark:text-gray-300 mt-4">
                <li>Email: <a href="mailto:legal@bigurl.co" className="text-blue-600 dark:text-blue-400 hover:underline">legal@bigurl.co</a></li>
                <li>Support: <a href="mailto:support@bigurl.co" className="text-blue-600 dark:text-blue-400 hover:underline">support@bigurl.co</a></li>
                <li>Contact Form: <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">bigurl.co/contact</a></li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

