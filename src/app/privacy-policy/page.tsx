import { Metadata } from "next";
import { siteConfig } from "@/config/site";

const PAGE_URL = `${siteConfig.siteUrl}/privacy-policy`;

export const metadata: Metadata = {
  title: "Privacy Policy — Pickleball Playbook",
  description: "Privacy Policy for Pickleball Playbook and the Pickleball Drills app.",
  alternates: { canonical: PAGE_URL },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "July 28, 2026";

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-200">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: {lastUpdated}</p>

      <section className="space-y-8 text-gray-300 leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>
              <strong className="text-white">Account information:</strong> name, email address, and
              password when you create an account
            </li>
            <li>
              <strong className="text-white">Payment information:</strong> processed securely
              through Stripe — we do not store your card details
            </li>
            <li>
              <strong className="text-white">Usage data:</strong> pages visited, drills viewed,
              and app activity to improve the Service
            </li>
            <li>
              <strong className="text-white">Community content:</strong> posts and comments you
              submit
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Provide and improve the Service</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send transactional and product update emails</li>
            <li>Respond to support requests</li>
            <li>Monitor for abuse and enforce our Terms of Service</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">3. Information Sharing</h2>
          <p>
            We do not sell your personal information. We share data only with trusted third-party
            service providers necessary to operate the Service, including:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Stripe (payment processing)</li>
            <li>Firebase / Google (authentication and database)</li>
            <li>Amazon Web Services (email delivery)</li>
          </ul>
          <p className="mt-2">
            We may disclose information if required by law or to protect the rights and safety of
            our users.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">4. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to maintain session state, analyze usage, and
            improve the Service. You can disable cookies in your browser settings, though some
            features may not function correctly.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">5. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. You may request
            deletion of your account and associated data by emailing{" "}
            <a href="mailto:austin@pickleballplaybook.app" className="text-teal-400 underline">
              austin@pickleballplaybook.app
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">6. Children's Privacy</h2>
          <p>
            The Service is not directed to children under 13. We do not knowingly collect personal
            information from children under 13. If you believe we have done so, please contact us
            immediately.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">7. Security</h2>
          <p>
            We implement industry-standard security measures to protect your information.
            However, no transmission over the internet is completely secure, and we cannot
            guarantee absolute security.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes via email or a notice in the app.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">9. Contact</h2>
          <p>
            Questions about this Privacy Policy? Email us at{" "}
            <a href="mailto:austin@pickleballplaybook.app" className="text-teal-400 underline">
              austin@pickleballplaybook.app
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
