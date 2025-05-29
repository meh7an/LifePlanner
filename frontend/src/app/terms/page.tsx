"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

const TermsPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Update active section based on scroll position
      const sections = [
        "acceptance",
        "description",
        "accounts",
        "conduct",
        "content",
        "privacy",
        "termination",
        "disclaimers",
        "limitation",
        "governing",
        "changes",
        "contact",
      ];
      const currentSection = sections.find((section) => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });

      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const tableOfContents = [
    { id: "acceptance", title: "Acceptance of Terms" },
    { id: "description", title: "Service Description" },
    { id: "accounts", title: "User Accounts" },
    { id: "conduct", title: "User Conduct" },
    { id: "content", title: "User Content" },
    { id: "privacy", title: "Privacy Policy" },
    { id: "termination", title: "Termination" },
    { id: "disclaimers", title: "Disclaimers" },
    { id: "limitation", title: "Limitation of Liability" },
    { id: "governing", title: "Governing Law" },
    { id: "changes", title: "Changes to Terms" },
    { id: "contact", title: "Contact Information" },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-green-100 dark:border-green-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  Life Planner
                </span>
              </Link>

              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/contact"
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors"
                >
                  Contact
                </Link>
                <Link
                  href="/dashboard"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 dark:from-green-600/5 dark:to-emerald-600/5 transform"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />

          <div className="max-w-4xl mx-auto text-center relative">
            <div
              className="inline-block p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-6 transform"
              style={{
                transform: `rotate(${Math.sin(scrollY * 0.01) * 2}deg)`,
              }}
            >
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Terms of{" "}
              <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Service
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              The legal stuff made simple and fair
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: May 29, 2025
            </p>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Table of Contents - Sticky Sidebar */}
            <div className="lg:w-1/4">
              <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-green-100 dark:border-green-800/30 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                  Quick Navigation
                </h3>
                <nav className="space-y-2">
                  {tableOfContents.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        activeSection === item.id
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                          : "text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400"
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Terms Content */}
            <div className="lg:w-3/4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-green-100 dark:border-green-800/30 overflow-hidden">
                <div className="p-8 lg:p-12 space-y-12">
                  {/* Introduction */}
                  <div className="text-center pb-8 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                      Welcome to Life Planner! These terms outline how you can
                      use our service. We&apos;ve tried to keep things
                      straightforward and fair for everyone.
                    </p>
                  </div>

                  {/* Section 1 */}
                  <section id="acceptance" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        1
                      </span>
                      Acceptance of Terms
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        By accessing and using Life Planner, you accept and
                        agree to be bound by the terms and provision of this
                        agreement. If you do not agree to abide by the above,
                        please do not use this service.
                      </p>
                      <p>
                        These Terms of Service apply to all users of the
                        service, including without limitation users who are
                        browsers, vendors, customers, merchants, and
                        contributors of content.
                      </p>
                    </div>
                  </section>

                  {/* Section 2 */}
                  <section id="description" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        2
                      </span>
                      Service Description
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        Life Planner is a comprehensive productivity and
                        organization platform that provides:
                      </p>
                      <ul>
                        <li>
                          Task and project management through customizable
                          boards and lists
                        </li>
                        <li>
                          Calendar integration for scheduling and time
                          management
                        </li>
                        <li>Focus session tools to enhance productivity</li>
                        <li>
                          Collaboration features for team and personal use
                        </li>
                        <li>
                          Memory and archive systems for information retention
                        </li>
                        <li>Streak tracking and progress monitoring</li>
                      </ul>
                      <p>
                        We reserve the right to modify, suspend, or discontinue
                        any part of our service at any time with reasonable
                        notice to users.
                      </p>
                    </div>
                  </section>

                  {/* Section 3 */}
                  <section id="accounts" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        3
                      </span>
                      User Accounts
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        To access certain features of Life Planner, you must
                        register for an account. When you create an account, you
                        agree to:
                      </p>
                      <ul>
                        <li>
                          Provide accurate, current, and complete information
                        </li>
                        <li>
                          Maintain and update your information to keep it
                          accurate
                        </li>
                        <li>
                          Maintain the security of your password and account
                        </li>
                        <li>
                          Accept responsibility for all activities under your
                          account
                        </li>
                        <li>
                          Notify us immediately of any unauthorized use of your
                          account
                        </li>
                      </ul>
                      <p>
                        You are responsible for safeguarding your password and
                        all activities that occur under your account.
                      </p>
                    </div>
                  </section>

                  {/* Section 4 */}
                  <section id="conduct" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        4
                      </span>
                      User Conduct
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>You agree not to use Life Planner to:</p>
                      <ul>
                        <li>
                          Upload, post, or transmit any content that is
                          unlawful, harmful, threatening, abusive, harassing,
                          defamatory, or otherwise objectionable
                        </li>
                        <li>
                          Violate any laws in your jurisdiction or the
                          jurisdiction where Life Planner operates
                        </li>
                        <li>
                          Impersonate any person or entity or falsely state your
                          affiliation with any person or entity
                        </li>
                        <li>
                          Interfere with or disrupt the service or servers
                          connected to the service
                        </li>
                        <li>
                          Attempt to gain unauthorized access to any portion of
                          the service
                        </li>
                        <li>
                          Use the service for any commercial purpose without our
                          express written consent
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* Section 5 */}
                  <section id="content" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        5
                      </span>
                      User Content
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        You retain ownership of all content you create, upload,
                        or share through Life Planner. However, by using our
                        service, you grant us a limited license to:
                      </p>
                      <ul>
                        <li>
                          Store, process, and transmit your content as necessary
                          to provide the service
                        </li>
                        <li>
                          Create backups and ensure data redundancy for service
                          reliability
                        </li>
                        <li>
                          Display your shared content to users you&apos;ve
                          granted access to
                        </li>
                      </ul>
                      <p>
                        We will never use your personal content for marketing
                        purposes or share it with third parties without your
                        explicit consent, except as required by law.
                      </p>
                    </div>
                  </section>

                  {/* Section 6 */}
                  <section id="privacy" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        6
                      </span>
                      Privacy Policy
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        Your privacy is important to us. Our Privacy Policy
                        explains how we collect, use, and protect your
                        information when you use Life Planner. By using our
                        service, you agree to the collection and use of
                        information in accordance with our Privacy Policy.
                      </p>
                      <p>Key privacy principles we follow:</p>
                      <ul>
                        <li>
                          We collect only necessary information to provide our
                          service
                        </li>
                        <li>
                          We never sell your personal data to third parties
                        </li>
                        <li>
                          We use industry-standard encryption to protect your
                          data
                        </li>
                        <li>
                          You can request deletion of your data at any time
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* Section 7 */}
                  <section id="termination" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        7
                      </span>
                      Termination
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        You may terminate your account at any time by contacting
                        us or using the account deletion feature in your
                        settings. Upon termination:
                      </p>
                      <ul>
                        <li>
                          Your access to the service will cease immediately
                        </li>
                        <li>
                          Your data will be deleted within 30 days, except as
                          required by law
                        </li>
                        <li>
                          You may request an export of your data before deletion
                        </li>
                      </ul>
                      <p>
                        We may terminate or suspend your account if you violate
                        these terms, with notice when possible. We reserve the
                        right to refuse service to anyone for any reason at any
                        time.
                      </p>
                    </div>
                  </section>

                  {/* Section 8 */}
                  <section id="disclaimers" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        8
                      </span>
                      Disclaimers
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        Life Planner is provided on an &quot;as is&quot; and
                        &quot;as available&quot; basis. We make no
                        representations or warranties of any kind, express or
                        implied, regarding:
                      </p>
                      <ul>
                        <li>
                          The operation of our service or the information,
                          content, materials, or products included therein
                        </li>
                        <li>
                          The accuracy, reliability, or completeness of any
                          information on the service
                        </li>
                        <li>
                          That the service will be uninterrupted or error-free
                        </li>
                        <li>The security of data transmission or storage</li>
                      </ul>
                      <p>
                        While we strive for high availability and data security,
                        we cannot guarantee perfect uptime or absolute security.
                      </p>
                    </div>
                  </section>

                  {/* Section 9 */}
                  <section id="limitation" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        9
                      </span>
                      Limitation of Liability
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        To the fullest extent permitted by applicable law, Life
                        Planner shall not be liable for any indirect,
                        incidental, special, consequential, or punitive damages,
                        or any loss of profits or revenues, whether incurred
                        directly or indirectly, or any loss of data, use,
                        goodwill, or other intangible losses.
                      </p>
                      <p>
                        Our total liability to you for all damages, losses, and
                        causes of action shall not exceed the amount you have
                        paid us in the twelve (12) months preceding the claim.
                      </p>
                    </div>
                  </section>

                  {/* Section 10 */}
                  <section id="governing" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        10
                      </span>
                      Governing Law
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        These Terms shall be interpreted and governed by the
                        laws of the State of California, United States, without
                        regard to its conflict of law provisions. Any disputes
                        arising from these terms or your use of Life Planner
                        shall be resolved in the courts of California.
                      </p>
                    </div>
                  </section>

                  {/* Section 11 */}
                  <section id="changes" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        11
                      </span>
                      Changes to Terms
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        We reserve the right to modify these Terms of Service at
                        any time. When we make changes, we will:
                      </p>
                      <ul>
                        <li>
                          Update the &quot;Last updated&quot; date at the top of
                          this page
                        </li>
                        <li>
                          Send you an email notification if you have an account
                          with us
                        </li>
                        <li>
                          Provide at least 30 days notice for material changes
                        </li>
                        <li>
                          Post an announcement on our service for significant
                          updates
                        </li>
                      </ul>
                      <p>
                        Your continued use of Life Planner after changes become
                        effective constitutes acceptance of the revised terms.
                      </p>
                    </div>
                  </section>

                  {/* Section 12 */}
                  <section id="contact" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        12
                      </span>
                      Contact Information
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        If you have any questions about these Terms of Service,
                        please contact us:
                      </p>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                        <ul className="space-y-2 mb-0">
                          <li>
                            <strong>Email:</strong> legal@lifeplanner.app
                          </li>
                          <li>
                            <strong>Contact Form:</strong>{" "}
                            <Link
                              href="/contact"
                              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                            >
                              Visit our contact page
                            </Link>
                          </li>
                          <li>
                            <strong>Address:</strong> Life Planner Legal
                            Department, San Francisco, CA
                          </li>
                        </ul>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Footer CTA */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Questions about our terms?
                  </h3>
                  <p className="text-green-100 mb-4">
                    We&apos;re here to help clarify anything that seems unclear.
                  </p>
                  <Link
                    href="/contact"
                    className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span>Get in Touch</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-green-100 dark:border-green-800/30 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <Link
                href="/"
                className="flex items-center space-x-2 mb-4 md:mb-0"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  Life Planner
                </span>
              </Link>

              <div className="flex space-x-6 text-gray-600 dark:text-gray-400">
                <Link
                  href="/privacy"
                  className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Contact
                </Link>
                <Link
                  href="/"
                  className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Home
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:dark-gray-400">
              <p>&copy; 2025 Life Planner. Fair terms for everyone. 📋</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TermsPage;
