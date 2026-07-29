import { Metadata } from "next";
import { siteConfig } from "@/config/site";

const PAGE_URL = `${siteConfig.siteUrl}/terms-of-service`;

export const metadata: Metadata = {
  title: "Terms of Service — Pickleball Playbook",
  description: "Terms of Service for Pickleball Playbook and the Pickleball Drills app.",
  alternates: { canonical: PAGE_URL },
};

export default function TermsOfServicePage() {
  const lastUpdated = "July 28, 2026";

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-200">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: {lastUpdated}</p>

      <section className="space-y-8 text-gray-300 leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Pickleball Playbook, the Pickleball Drills mobile app, or any
            associated services (collectively, the "Service"), you agree to be bound by these Terms
            of Service. If you do not agree, do not use the Service.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">2. Description of Service</h2>
          <p>
            Pickleball Playbook provides pickleball instructional content, drill libraries,
            community features, and coaching resources through its website and mobile application.
            Some features require a paid subscription.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">3. Accounts and Subscriptions</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials.
            Subscriptions are billed on a recurring basis and may be cancelled at any time through
            your account settings. Refunds are handled on a case-by-case basis — contact us at{" "}
            <a href="mailto:austin@pickleballplaybook.app" className="text-teal-400 underline">
              austin@pickleballplaybook.app
            </a>{" "}
            for support.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">4. User Content</h2>
          <p>
            If you submit content to community features (such as comments or posts), you grant
            Pickleball Playbook a non-exclusive, royalty-free license to display and distribute
            that content within the Service. You retain ownership of your content.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">5. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Share, resell, or redistribute paid content without permission</li>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Post spam, abusive, or harmful content in community features</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">6. Intellectual Property</h2>
          <p>
            All content on the Service, including videos, drill descriptions, graphics, and text,
            is owned by Pickleball Playbook LLC or its licensors and is protected by copyright.
            Unauthorized reproduction or distribution is prohibited.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">7. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. Pickleball Playbook
            does not warrant that the Service will be uninterrupted, error-free, or free of
            harmful components.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Pickleball Playbook LLC shall not be liable
            for any indirect, incidental, or consequential damages arising from your use of the
            Service.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">9. Changes to Terms</h2>
          <p>
            We may update these Terms at any time. Continued use of the Service after changes
            constitutes acceptance of the new Terms.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">10. Contact</h2>
          <p>
            Questions about these Terms? Email us at{" "}
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
