import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header showGetStarted={false} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 sm:p-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Last updated: November 4, 2025
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                BigURL ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our URL shortening service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Personal Information</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>Email address</li>
                <li>Name (optional)</li>
                <li>Password (encrypted)</li>
                <li>Payment information (processed securely through Authorize.Net)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Usage Data</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We automatically collect certain information when you use BigURL:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>Original URLs you shorten</li>
                <li>Custom slugs you create</li>
                <li>Link creation timestamps</li>
                <li>Click analytics (IP addresses, location, device type, browser, operating system)</li>
                <li>Referrer information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">How We Use Your Information</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We use the collected information to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Provide and maintain our URL shortening service</li>
                <li>Process your transactions and subscriptions</li>
                <li>Send you service-related emails (welcome emails, updates)</li>
                <li>Provide analytics and insights about your shortened links</li>
                <li>Improve our service and develop new features</li>
                <li>Prevent fraud and abuse</li>
                <li>Respond to your support requests</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Data Sharing and Disclosure</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Service Providers:</strong> Payment processors (Authorize.Net), email services (Mailgun)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Data Security</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>All passwords are hashed using bcrypt</li>
                <li>HTTPS encryption for all data transmission</li>
                <li>Secure JWT-based authentication</li>
                <li>Payment data is processed through PCI-compliant Authorize.Net</li>
                <li>Regular security audits and updates</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Your Rights</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Access your personal data</li>
                <li>Update or correct your information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Request information about data we hold about you</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Cookies and Tracking</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We use essential cookies for authentication and session management. We use analytics to understand how our service is used. We do not use third-party advertising cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Data Retention</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We retain your data for as long as your account is active. When you delete your account, we permanently remove your personal information and links within 30 days. Analytics data may be retained in anonymized form for statistical purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Children's Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our service is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">International Users</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                If you are accessing our service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Changes to This Privacy Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <ul className="list-none space-y-2 text-gray-700 dark:text-gray-300 mt-4">
                <li>Email: <a href="mailto:privacy@bigurl.co" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@bigurl.co</a></li>
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

