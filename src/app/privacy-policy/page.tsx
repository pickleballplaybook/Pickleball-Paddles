import { Metadata } from "next";
import { siteConfig } from "@/config/site";

const PAGE_URL = `${siteConfig.siteUrl}/privacy-policy`;

export const metadata: Metadata = {
  title: "Privacy Policy — Pickleball Playbook",
  description: "Privacy Policy for Pickleball Playbook and the Pickleball Drills app.",
  alternates: { canonical: PAGE_URL },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-200">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-2">
        <strong className="text-gray-400">Effective Date:</strong> July 30, 2026
      </p>
      <p className="text-sm text-gray-500 mb-10">Last updated: July 30, 2026</p>

      <p className="text-gray-300 leading-relaxed mb-10">
        This Privacy Policy describes how Pickleball Playbook LLC (&quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;) collects, uses, and shares information about you when you use the Pickleball
        Drills app (available on iOS, Android, and web), website at{" "}
        <a href="https://playbookpaddles.com" className="text-[#5a9df9] underline">
          playbookpaddles.com
        </a>
        , and any related services (collectively, the &quot;Service&quot;). By using the Service, you
        agree to this Privacy Policy.
      </p>

      <section className="space-y-10 text-gray-300 leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
          <p className="mb-2">We collect the following categories of information:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong className="text-white">Account information:</strong> name, email address, and
              password (hashed) when you create an account via email, or profile information (name,
              email, profile photo) when you sign in with Google or Apple.
            </li>
            <li>
              <strong className="text-white">Payment information:</strong> billing name, last four
              card digits, and subscription status — processed securely through Stripe or Apple/Google
              In-App Purchase. We do not store full card numbers.
            </li>
            <li>
              <strong className="text-white">Usage data:</strong> pages visited, drills viewed,
              lessons watched, AI coach interactions, session duration, and other in-app activity used
              to improve the Service.
            </li>
            <li>
              <strong className="text-white">Community content:</strong> posts, comments, profile
              photos, and other content you submit to the community feed. This content is visible to
              other users of the Service.
            </li>
            <li>
              <strong className="text-white">Device and technical data:</strong> device type,
              operating system, app version, IP address, and crash/error reports.
            </li>
            <li>
              <strong className="text-white">Communications:</strong> emails you send to our support
              address and any feedback you submit through the app.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">2. Legal Basis for Processing</h2>
          <p className="mb-2">
            If you are located in the European Economic Area, United Kingdom, or another jurisdiction
            with similar laws, our legal bases for processing your personal data are:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong className="text-white">Contract performance:</strong> to provide you with the
              Service you have subscribed to.
            </li>
            <li>
              <strong className="text-white">Legitimate interests:</strong> to operate, maintain, and
              improve the Service, prevent fraud, and communicate with you about your account.
            </li>
            <li>
              <strong className="text-white">Legal obligation:</strong> to comply with applicable laws
              and regulations.
            </li>
            <li>
              <strong className="text-white">Consent:</strong> for optional communications such as
              marketing emails, where we obtain your prior consent and you may withdraw it at any time.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h2>
          <p className="mb-2">We use your information to:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Provide and personalize the Service, including AI-generated drill recommendations.</li>
            <li>Process payments and manage your subscription.</li>
            <li>Send transactional emails (receipts, password resets, account notices).</li>
            <li>Send product update and marketing emails (you may unsubscribe at any time).</li>
            <li>Respond to your support requests.</li>
            <li>Monitor for abuse and enforce our Terms of Service.</li>
            <li>Analyze usage patterns to improve features and fix bugs.</li>
            <li>Comply with legal obligations.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">4. Third-Party Services</h2>
          <p className="mb-2">
            We share data only with the third-party service providers necessary to operate the
            Service. These providers are contractually bound to protect your data and may not use it
            for their own purposes. Current providers include:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong className="text-white">Firebase / Google:</strong> authentication, real-time
              database, cloud functions, and hosting.
            </li>
            <li>
              <strong className="text-white">Stripe:</strong> payment processing and subscription
              management.
            </li>
            <li>
              <strong className="text-white">RevenueCat:</strong> in-app purchase tracking and
              entitlement management.
            </li>
            <li>
              <strong className="text-white">Resend:</strong> transactional email delivery.
            </li>
            <li>
              <strong className="text-white">OpenAI:</strong> AI-powered drill planner and academy
              coach features. Prompts may include your in-app activity context.
            </li>
            <li>
              <strong className="text-white">Sentry:</strong> error monitoring and crash reporting.
            </li>
            <li>
              <strong className="text-white">Vimeo:</strong> video hosting and playback.
            </li>
            <li>
              <strong className="text-white">Meta (Facebook) Pixel / AppsFlyer:</strong> marketing
              attribution and analytics (aggregated/anonymized where possible).
            </li>
            <li>
              <strong className="text-white">Supabase:</strong> subscription state mirroring for
              server-side queries.
            </li>
          </ul>
          <p className="mt-3">
            We may also disclose your information if required by law, court order, or to protect the
            rights, property, or safety of Pickleball Playbook LLC, our users, or the public.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">5. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to maintain session state, analyze usage, and
            improve the Service. Third-party analytics and advertising partners may also place cookies
            on your device when you visit our website. You can disable cookies in your browser
            settings, though some features may not function correctly. You may also opt out of
            interest-based advertising through your device settings or the{" "}
            <a
              href="https://optout.aboutads.info"
              className="text-[#5a9df9] underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Digital Advertising Alliance opt-out
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">6. Community Content</h2>
          <p>
            Content you post to the community feed — including posts, comments, profile name, and
            profile photo — is visible to other registered users of the Service. Do not include
            sensitive personal information in community posts. We reserve the right to remove content
            that violates our Terms of Service. Even after deletion, copies may briefly persist in
            caches or backups.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">7. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active or as needed to provide
            the Service. If you cancel your subscription, your account and data are retained until
            you request deletion. Anonymized usage analytics may be retained indefinitely. Backup
            copies may persist for up to 90 days after deletion. You may request deletion of your
            account and associated personal data at any time — see Section 9 (Your Rights) below.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">8. Security</h2>
          <p>
            We implement industry-standard security measures, including TLS encryption in transit,
            access controls, and regular security reviews. Passwords are stored as cryptographic
            hashes — we never store them in plain text. However, no system is perfectly secure. If
            you believe your account has been compromised, contact us immediately at{" "}
            <a href="mailto:austin@pbdrills.com" className="text-[#5a9df9] underline">
              austin@pbdrills.com
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">9. Your Rights</h2>
          <p className="mb-2">
            Depending on your location, you may have the following rights regarding your personal
            data:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong className="text-white">Access:</strong> request a copy of the personal
              information we hold about you.
            </li>
            <li>
              <strong className="text-white">Correction:</strong> request that we correct inaccurate
              or incomplete information.
            </li>
            <li>
              <strong className="text-white">Deletion:</strong> request that we delete your account
              and associated personal data (see Section 10).
            </li>
            <li>
              <strong className="text-white">Portability:</strong> request a machine-readable export
              of your data.
            </li>
            <li>
              <strong className="text-white">Objection / restriction:</strong> object to or request
              restriction of certain processing activities.
            </li>
            <li>
              <strong className="text-white">Withdraw consent:</strong> where processing is based on
              consent, withdraw it at any time without affecting prior lawful processing.
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email{" "}
            <a href="mailto:austin@pbdrills.com" className="text-[#5a9df9] underline">
              austin@pbdrills.com
            </a>{" "}
            with your request. We will respond within 30 days.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            10. California Privacy Rights (CCPA / CPRA)
          </h2>
          <p className="mb-2">
            If you are a California resident, you have additional rights under the California Consumer
            Privacy Act (CCPA) and California Privacy Rights Act (CPRA):
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong className="text-white">Know:</strong> the categories of personal information we
              collect, the purposes for which we use it, and the categories of third parties with whom
              we share it.
            </li>
            <li>
              <strong className="text-white">Delete:</strong> your personal information (subject to
              certain exceptions).
            </li>
            <li>
              <strong className="text-white">Opt out of sale or sharing:</strong> We do not sell your
              personal information. We do not share personal information with third parties for
              cross-context behavioral advertising.
            </li>
            <li>
              <strong className="text-white">Non-discrimination:</strong> we will not discriminate
              against you for exercising your California privacy rights.
            </li>
          </ul>
          <p className="mt-3">
            To submit a California rights request, email{" "}
            <a href="mailto:austin@pbdrills.com" className="text-[#5a9df9] underline">
              austin@pbdrills.com
            </a>{" "}
            with &quot;California Privacy Request&quot; in the subject line.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">11. Account Deletion</h2>
          <p>
            You may delete your account at any time by emailing{" "}
            <a href="mailto:austin@pbdrills.com" className="text-[#5a9df9] underline">
              austin@pbdrills.com
            </a>{" "}
            with the subject &quot;Delete my account.&quot; Upon verification of your identity, we
            will delete your account, profile data, and associated personal information within 30
            days. Community posts you authored may be anonymized rather than deleted if doing so is
            necessary to preserve the integrity of other users&apos; content (such as replies to your
            posts). Subscription cancellation through the App Store or Google Play does not
            automatically delete your account — you must submit a deletion request separately.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">12. International Data Transfers</h2>
          <p>
            Pickleball Playbook LLC is based in the United States. If you access the Service from
            outside the United States, your information will be transferred to, stored, and processed
            in the United States or other countries where our service providers operate. Data
            protection laws in these countries may differ from those in your home country. By using
            the Service, you consent to this transfer. Where required, we take appropriate safeguards
            (such as contractual clauses with service providers) to protect your data.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">13. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed to children under 13. We do not knowingly collect personal
            information from children under 13. If you believe we have inadvertently collected
            information from a child under 13, please contact us immediately at{" "}
            <a href="mailto:austin@pbdrills.com" className="text-[#5a9df9] underline">
              austin@pbdrills.com
            </a>{" "}
            and we will delete it promptly.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">14. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the
            &quot;Last updated&quot; date at the top. For significant changes, we will notify you via
            email or a notice in the app at least 7 days before the change takes effect. Your
            continued use of the Service after the effective date constitutes acceptance of the
            updated policy.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">15. Contact Us</h2>
          <p>
            Questions, requests, or concerns about this Privacy Policy? Contact us at:
          </p>
          <address className="not-italic mt-3 text-gray-300">
            <strong className="text-white">Pickleball Playbook LLC</strong>
            <br />
            St. George, UT, USA
            <br />
            <a href="mailto:austin@pbdrills.com" className="text-[#5a9df9] underline">
              austin@pbdrills.com
            </a>
          </address>
        </div>
      </section>
    </main>
  );
}
