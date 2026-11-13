import { Metadata } from "next";
import { siteConfig } from "@/config/site";

const PAGE_URL = `${siteConfig.siteUrl}/terms-of-service`;

export const metadata: Metadata = {
  title: "Terms of Service — Pickleball Playbook",
  description: "Terms of Service for Pickleball Playbook and the Pickleball Drills app.",
  alternates: { canonical: PAGE_URL },
};

export default function TermsOfServicePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-200">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-2">
        <strong className="text-gray-400">Effective Date:</strong> July 30, 2026
      </p>
      <p className="text-sm text-gray-500 mb-10">Last updated: July 30, 2026</p>

      <p className="text-gray-300 leading-relaxed mb-10">
        These Terms of Service (&quot;Terms&quot;) are a legal agreement between you and Pickleball
        Playbook LLC (&quot;Pickleball Playbook,&quot; &quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;). They govern your access to and use of the Pickleball Drills app (available
        on iOS, Android, and web), the website at{" "}
        <a href="https://playbookpaddles.com" className="text-[#5a9df9] underline">
          playbookpaddles.com
        </a>
        , and all related services, features, and content (collectively, the &quot;Service&quot;).{" "}
        <strong className="text-white">
          By creating an account, subscribing, or otherwise using the Service, you agree to be bound
          by these Terms. If you do not agree, do not use the Service.
        </strong>
      </p>

      <section className="space-y-10 text-gray-300 leading-relaxed">

        {/* 1 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">1. Description of Service</h2>
          <p className="mb-2">
            Pickleball Playbook provides a pickleball training and community platform that currently
            includes, and may in the future expand to include:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Pickleball instructional content and drill libraries</li>
            <li>Video courses and on-demand lesson programs</li>
            <li>AI-powered coaching and drill planning features</li>
            <li>Community feed with posts, comments, and likes</li>
            <li>Direct messaging between users</li>
            <li>Player map and location-based discovery features</li>
            <li>Skill assessments and level tracking</li>
            <li>Mobile applications (iOS and Android)</li>
            <li>Web application and website</li>
            <li>Subscription-based access to premium content</li>
            <li>Any additional features or services we introduce in the future</li>
          </ul>
          <p className="mt-3">
            Some features are available only to subscribers. We reserve the right to modify,
            suspend, or discontinue any part of the Service at any time with reasonable notice where
            practicable.
          </p>
        </div>

        {/* 2 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">2. Accounts</h2>
          <p className="mb-2">
            To access certain features, you must create an account. By doing so, you agree to:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              Provide accurate, current, and complete information and keep it up to date.
            </li>
            <li>
              Maintain the confidentiality of your login credentials and not share them with others.
            </li>
            <li>
              Accept responsibility for all activity that occurs under your account, whether or not
              authorized by you.
            </li>
            <li>
              Notify us immediately at{" "}
              <a href="mailto:austin@pbdrills.com" className="text-[#5a9df9] underline">
                austin@pbdrills.com
              </a>{" "}
              if you suspect unauthorized access to your account.
            </li>
          </ul>
          <p className="mt-3">
            You may not create an account on behalf of another person without their authorization.
            We reserve the right to suspend or terminate accounts that violate these Terms or that
            we reasonably believe pose a risk to the Service or its users.
          </p>
        </div>

        {/* 3 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">3. Subscriptions and Billing</h2>
          <p className="mb-3">
            Access to premium features requires a paid subscription. The following terms apply to
            all subscriptions:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong className="text-white">Recurring billing.</strong> Subscriptions are billed on
              a recurring basis (monthly or annually, depending on the plan you select) until
              cancelled.
            </li>
            <li>
              <strong className="text-white">Automatic renewal.</strong> Your subscription
              automatically renews at the end of each billing period unless you cancel before the
              renewal date.
            </li>
            <li>
              <strong className="text-white">How to cancel.</strong> You may cancel at any time
              through your account settings within the app, through the App Store (iOS), or through
              Google Play (Android). Web subscribers may manage their subscription through the
              billing portal in their account settings.
            </li>
            <li>
              <strong className="text-white">Effect of cancellation.</strong> Cancellation stops
              future renewals and prevents future charges. You retain access to paid features through
              the end of your current billing period. Cancellation does not automatically entitle
              you to a refund for the current period.
            </li>
            <li>
              <strong className="text-white">Refunds.</strong> Refunds are governed by the platform
              through which you subscribed. iOS subscribers should request refunds through Apple
              (reportaproblem.apple.com). Android subscribers should request refunds through Google
              Play. Web subscribers should manage refunds through their billing portal. We do not
              process refunds directly and are not responsible for refund decisions made by Apple or
              Google.
            </li>
            <li>
              <strong className="text-white">Price changes.</strong> We may change subscription
              pricing from time to time. We will provide reasonable advance notice (at least 30 days)
              before any price increase takes effect. Continued use of the Service after the new price
              takes effect constitutes your acceptance of the new pricing.
            </li>
            <li>
              <strong className="text-white">Taxes.</strong> Prices may be exclusive of applicable
              taxes, which will be added where required by law.
            </li>
          </ul>
        </div>

        {/* 4 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">4. Health and Safety Disclaimer</h2>
          <p className="mb-2">
            The instructional content provided through the Service — including drills, exercises,
            techniques, and coaching guidance — is intended for educational and informational
            purposes only.
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              You participate in all drills and physical activities at your own risk.
            </li>
            <li>
              You should consult a qualified physician or healthcare provider before beginning any
              new exercise program, particularly if you have any pre-existing health conditions,
              injuries, or physical limitations.
            </li>
            <li>
              Pickleball Playbook LLC is not a medical provider and the Service does not constitute
              medical advice.
            </li>
            <li>
              We are not responsible for any injuries, accidents, health complications, or damages
              that result from your participation in activities suggested or described through the
              Service.
            </li>
          </ul>
        </div>

        {/* 5 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">5. AI Features Disclaimer</h2>
          <p className="mb-2">
            The Service includes AI-powered coaching, drill planning, and recommendation features.
            By using these features, you acknowledge that:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              AI-generated responses are provided for informational and educational purposes only.
            </li>
            <li>
              AI responses may occasionally be inaccurate, incomplete, or not suited to your
              specific circumstances.
            </li>
            <li>
              You should rely on your own judgment when evaluating AI-generated content and not
              treat it as professional coaching, medical, or legal advice.
            </li>
            <li>
              Pickleball Playbook LLC makes no guarantees about the accuracy, reliability, or
              fitness for a particular purpose of AI-generated content.
            </li>
          </ul>
        </div>

        {/* 6 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">6. User Content</h2>
          <p className="mb-2">
            The Service allows you to submit posts, comments, photos, messages, and other content
            (&quot;User Content&quot;). Regarding User Content:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong className="text-white">Ownership.</strong> You retain ownership of User Content
              you create.
            </li>
            <li>
              <strong className="text-white">License to us.</strong> By submitting User Content, you
              grant Pickleball Playbook LLC a worldwide, non-exclusive, royalty-free, sublicensable
              license to host, store, reproduce, display, distribute, modify, and use your User
              Content solely for the purposes of operating, improving, and promoting the Service.
              This license ends when you delete your User Content or your account, except where
              copies have been shared with others or are needed to maintain system integrity.
            </li>
            <li>
              <strong className="text-white">Your representations.</strong> You represent and warrant
              that you own or have obtained all necessary rights, licenses, and permissions to submit
              your User Content and to grant us the license above, and that your User Content does not
              infringe the rights of any third party.
            </li>
            <li>
              <strong className="text-white">Your responsibility.</strong> You are solely responsible
              for the accuracy, legality, and appropriateness of your User Content.
            </li>
          </ul>
        </div>

        {/* 7 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">7. Content Moderation</h2>
          <p>
            We reserve the right — but have no obligation — to review, monitor, remove, or restrict
            access to any User Content, posts, comments, or messages at our sole discretion, without
            prior notice, if we believe such content violates these Terms, applicable law, or may
            harm the community. We may also suspend or terminate accounts involved in such conduct.
            Content moderation decisions are final at our discretion, though you may contact us to
            appeal a decision.
          </p>
        </div>

        {/* 8 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">8. Prohibited Conduct</h2>
          <p className="mb-2">You agree not to use the Service to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Violate any applicable local, state, national, or international law or regulation</li>
            <li>Harass, threaten, intimidate, bully, or demean any person</li>
            <li>Post or transmit hate speech or content that demeans individuals based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics</li>
            <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
            <li>Share, resell, redistribute, or commercially exploit paid content without written permission</li>
            <li>Share your account credentials with others or allow multiple people to use a single account</li>
            <li>Circumvent, bypass, or attempt to bypass subscription access controls or paywalls</li>
            <li>Upload or transmit malware, viruses, ransomware, or any other malicious code</li>
            <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the app or Service</li>
            <li>Scrape, copy, mirror, or reproduce content from the Service without authorization</li>
            <li>Use bots, scrapers, crawlers, or other automated tools to access or collect content from the Service without our prior written consent</li>
            <li>Attempt to gain unauthorized access to any part of the Service, our servers, or connected systems</li>
            <li>Disrupt, overload, or interfere with the proper functioning of the Service or its infrastructure</li>
            <li>Post spam, unsolicited promotional content, or chain letters</li>
            <li>Collect or harvest personal information about other users without their consent</li>
          </ul>
          <p className="mt-3">
            Violations may result in immediate suspension or termination of your account and, where
            applicable, referral to law enforcement.
          </p>
        </div>

        {/* 9 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">9. Intellectual Property</h2>
          <p className="mb-2">
            All content and materials available through the Service — including but not limited to
            videos, courses, drill libraries, AI-generated outputs, written content, graphics,
            logos, trademarks, trade dress, software, code, and branding — are owned by Pickleball
            Playbook LLC or its licensors and are protected by U.S. and international copyright,
            trademark, and other intellectual property laws.
          </p>
          <p className="mb-2">
            You may not, without our prior written permission:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Copy, reproduce, or duplicate any content from the Service</li>
            <li>Redistribute, publish, or publicly display Service content</li>
            <li>Modify, create derivative works of, or adapt Service content</li>
            <li>Sell, license, sublicense, or commercially exploit Service content</li>
            <li>Remove or alter any copyright, trademark, or other proprietary notices</li>
          </ul>
          <p className="mt-3">
            Your subscription grants you a limited, non-exclusive, non-transferable, revocable
            license to access and use the Service for your personal, non-commercial purposes only.
            This license does not include any resale or commercial use of the Service or its content.
          </p>
        </div>

        {/* 10 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">10. Privacy</h2>
          <p>
            Your use of the Service is also governed by our{" "}
            <a href="/privacy-policy" className="text-[#5a9df9] underline">
              Privacy Policy
            </a>
            , which is incorporated into these Terms by reference. By using the Service, you consent
            to the collection and use of your information as described in the Privacy Policy.
          </p>
        </div>

        {/* 11 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">11. Third-Party Services and Links</h2>
          <p>
            The Service may integrate with or link to third-party services (such as Stripe for
            payments, Apple App Store, Google Play, or social platforms). These third parties have
            their own terms and privacy policies. We are not responsible for the content, practices,
            or availability of third-party services, and your use of them is at your own risk.
          </p>
        </div>

        {/* 12 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">12. Disclaimer of Warranties</h2>
          <p className="mb-2">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED &quot;AS
            IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
            <li>Any guarantee of uninterrupted, timely, secure, or error-free availability of the Service</li>
            <li>Any guarantee that information or content is accurate, complete, or current</li>
            <li>Any guarantee that defects will be corrected</li>
            <li>Any guarantee that the Service is free of viruses or other harmful components</li>
          </ul>
          <p className="mt-3">
            Some jurisdictions do not allow exclusion of implied warranties, so some of the above
            exclusions may not apply to you.
          </p>
        </div>

        {/* 13 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">13. Limitation of Liability</h2>
          <p className="mb-2">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PICKLEBALL PLAYBOOK LLC, ITS OWNERS,
            OFFICERS, EMPLOYEES, CONTRACTORS, AFFILIATES, AND LICENSORS SHALL NOT BE LIABLE FOR ANY:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Indirect, incidental, special, punitive, exemplary, or consequential damages</li>
            <li>Lost profits or revenue</li>
            <li>Loss of data or content</li>
            <li>Business interruption</li>
            <li>Personal injury or property damage arising from use of the Service</li>
            <li>
              Damages arising from unauthorized access to or alteration of your account or
              transmissions
            </li>
            <li>
              Any damages arising from your reliance on AI-generated content, instructional content,
              or community content
            </li>
          </ul>
          <p className="mt-3">
            IN NO EVENT WILL OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR
            RELATED TO THE SERVICE EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO US IN THE TWELVE
            (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100).
          </p>
          <p className="mt-3">
            Some jurisdictions do not allow limitation of liability for certain types of damages, so
            some of the above may not apply to you.
          </p>
        </div>

        {/* 14 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">14. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless Pickleball Playbook LLC, its owners,
            officers, employees, contractors, affiliates, and licensors from and against any and all
            claims, liabilities, damages, losses, costs, and expenses (including reasonable
            attorneys&apos; fees) arising out of or relating to: (a) your use of or access to the
            Service; (b) your violation of these Terms; (c) your violation of any rights of another
            person or entity; or (d) your User Content. We reserve the right to assume exclusive
            control of any matter subject to indemnification, in which case you agree to cooperate
            with us in asserting available defenses.
          </p>
        </div>

        {/* 15 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">15. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service, with or without notice, for any
            reason, including if we reasonably believe you have violated these Terms or engaged in
            conduct that is harmful to the Service, other users, or Pickleball Playbook LLC. Upon
            termination, your right to use the Service ceases immediately. Provisions of these Terms
            that by their nature should survive termination — including ownership, disclaimers,
            indemnification, limitation of liability, and governing law — will survive.
          </p>
        </div>

        {/* 16 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">16. Governing Law and Disputes</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the State of
            Utah, without regard to its conflict of law principles. You agree that any dispute
            arising out of or relating to these Terms or the Service shall be resolved exclusively
            in the state or federal courts located in Washington County, Utah, and you consent to
            personal jurisdiction in those courts. Notwithstanding the foregoing, we may seek
            injunctive or other equitable relief in any court of competent jurisdiction.
          </p>
        </div>

        {/* 17 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">17. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. When we do, we will revise the &quot;Last
            updated&quot; date at the top. For material changes, we will provide at least 7 days&apos;
            advance notice via email or an in-app notice before the change takes effect. Your
            continued use of the Service after the effective date of updated Terms constitutes your
            acceptance of those changes.
          </p>
        </div>

        {/* 18 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">18. Severability</h2>
          <p>
            If any provision of these Terms is found to be invalid, illegal, or unenforceable by a
            court of competent jurisdiction, that provision will be modified to the minimum extent
            necessary to make it enforceable, or severed if modification is not possible. The
            remaining provisions of these Terms will continue in full force and effect.
          </p>
        </div>

        {/* 19 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">19. Entire Agreement</h2>
          <p>
            These Terms, together with our{" "}
            <a href="/privacy-policy" className="text-[#5a9df9] underline">
              Privacy Policy
            </a>
            , constitute the entire agreement between you and Pickleball Playbook LLC regarding your
            use of the Service. They supersede all prior or contemporaneous agreements,
            representations, warranties, and understandings between you and us relating to the
            Service. No waiver of any provision of these Terms shall be effective unless in writing
            and signed by Pickleball Playbook LLC.
          </p>
        </div>

        {/* 20 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">20. Contact Us</h2>
          <p>Questions about these Terms? Contact us at:</p>
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
