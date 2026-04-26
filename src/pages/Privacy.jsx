import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-slate-800 leading-relaxed [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1 [&_a]:text-rose-600 [&_a]:underline">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: April 26, 2026</p>

      <p>
        This Privacy Policy explains how FBM Ventures LLC ("LaunchBox", "we",
        "us") collects, uses, and shares information when you use the LaunchBox
        application and related services (the "Service"). FBM Ventures LLC is a
        Wyoming limited liability company with a registered address at 30 N
        Gould St, Sheridan, WY 82801, USA.
      </p>

      <h2>1. Information we collect</h2>
      <p>We collect the following information:</p>
      <ul>
        <li>
          <strong>Account information:</strong> name, email address, password,
          and any profile details you provide.
        </li>
        <li>
          <strong>Content you create:</strong> packages, pricing, deliverables,
          contracts, branding, and any other content you upload.
        </li>
        <li>
          <strong>Payment information:</strong> handled by Stripe. We do not
          store your full card details. We retain billing metadata such as
          subscription status and invoice history.
        </li>
        <li>
          <strong>Usage data:</strong> pages visited, actions taken, device and
          browser information, IP address, and approximate location, collected
          via PostHog and similar tools.
        </li>
        <li>
          <strong>Communications:</strong> messages you send us via email or
          support channels.
        </li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>to provide, operate, and maintain the Service;</li>
        <li>to process payments and manage your subscription;</li>
        <li>to send transactional emails (account, billing, password reset);</li>
        <li>to analyze usage and improve the Service;</li>
        <li>to detect, prevent, and address fraud or abuse;</li>
        <li>to communicate with you about updates, features, and support;</li>
        <li>to comply with legal obligations.</li>
      </ul>

      <h2>3. Service providers we share data with</h2>
      <p>
        We share data with third-party service providers as needed to run the
        Service:
      </p>
      <ul>
        <li><strong>Stripe</strong> — payment processing and billing</li>
        <li><strong>Supabase</strong> — database, authentication, and auth emails</li>
        <li><strong>Vercel</strong> — application hosting</li>
        <li><strong>PostHog</strong> — product analytics and session replay</li>
        <li><strong>Google Analytics</strong> — website and app analytics</li>
        <li><strong>Facebook Pixel</strong> — advertising measurement</li>
      </ul>
      <p>
        We may add or replace service providers from time to time. The current
        list is maintained on this page and updated when changes occur.
      </p>

      <h2>4. Cookies, tracking, and session replay</h2>
      <p>
        We use cookies and similar technologies for authentication, session
        management, analytics, and advertising measurement. You can control
        cookies through your browser settings, but disabling them may affect
        functionality.
      </p>
      <p>
        <strong>Session replay:</strong> PostHog may record your interactions
        with the Service (mouse movements, clicks, scrolls, page navigation, and
        on-screen content) to help us debug issues and improve the product.
        Sensitive form fields such as passwords and payment details are masked
        and not recorded. You can opt out of session replay by contacting us at
        info@launch-box.io.
      </p>

      <h2>4a. Marketing communications</h2>
      <p>
        We may send you marketing emails about new features, tips, or
        promotions. You can opt out at any time by clicking the "unsubscribe"
        link in any marketing email or by contacting us at info@launch-box.io.
        Transactional emails (account, billing, password reset) are required
        for the Service and cannot be opted out of while your account is
        active.
      </p>

      <h2>4b. California residents (CCPA / CPRA)</h2>
      <p>
        If you are a California resident, you have additional rights under the
        California Consumer Privacy Act, including the right to know what
        personal information we collect, the right to delete it, the right to
        correct it, and the right to opt out of the "sale" or "sharing" of
        personal information. We do not sell your personal information for
        money. We may share data with advertising partners (e.g., Facebook
        Pixel) which may qualify as "sharing" under the CPRA. To opt out,
        contact us at info@launch-box.io with the subject line "Do Not Sell or
        Share My Personal Information".
      </p>

      <h2>4c. EU and UK residents (GDPR / UK GDPR)</h2>
      <p>
        If you are in the EU, EEA, or UK, we process your personal data on the
        following legal bases:
      </p>
      <ul>
        <li>
          <strong>Contract:</strong> to provide the Service you signed up for
          (account, billing, content storage).
        </li>
        <li>
          <strong>Legitimate interests:</strong> to operate, secure, and
          improve the Service, prevent fraud, and analyze usage.
        </li>
        <li>
          <strong>Consent:</strong> for marketing communications and certain
          cookies, where required.
        </li>
        <li>
          <strong>Legal obligation:</strong> to comply with applicable law.
        </li>
      </ul>
      <p>
        You have the right to lodge a complaint with your local data
        protection authority.
      </p>

      <h2>5. Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>access the personal data we hold about you;</li>
        <li>correct inaccurate information;</li>
        <li>request deletion of your data;</li>
        <li>export your data in a portable format;</li>
        <li>object to or restrict certain processing;</li>
        <li>withdraw consent where processing is based on consent.</li>
      </ul>
      <p>
        To exercise these rights, contact us at info@launch-box.io.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We retain your account and content for as long as your account is
        active. When you delete your account, we retain your data for 30 days
        to allow restoration, after which it is permanently deleted. Some
        records (e.g., billing data) may be retained longer where required by
        law.
      </p>

      <h2>7. Security</h2>
      <p>
        We use industry-standard measures to protect your data, including
        encryption in transit and access controls. No system is perfectly
        secure, and we cannot guarantee absolute security.
      </p>

      <h2>7a. Data breach notification</h2>
      <p>
        If we become aware of a security incident that affects your personal
        data, we will notify you and, where required, the relevant supervisory
        authorities, in accordance with applicable law. Notification will be
        sent to the email address associated with your account and will
        describe the nature of the incident, the data involved (to the extent
        known), and the steps we are taking in response.
      </p>

      <h2>8. International users</h2>
      <p>
        LaunchBox is operated from the United States. If you access the Service
        from outside the US, your information will be transferred to and
        processed in the US and other jurisdictions where our service providers
        operate.
      </p>

      <h2>9. Children's privacy</h2>
      <p>
        The Service is not directed to children under 18, and we do not
        knowingly collect personal information from children under 18.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. For material
        changes, we will notify you by email and post a notice in the Service.
        For minor changes, we will update the "Last updated" date above.
      </p>

      <h2>11. Contact</h2>
      <p>
        Privacy questions or requests? Contact us at info@launch-box.io.
      </p>
    </div>
  );
}
