"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

const PrivacyPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Update active section based on scroll position
      const sections = [
        "introduction",
        "collection",
        "usage",
        "sharing",
        "storage",
        "cookies",
        "rights",
        "security",
        "children",
        "international",
        "updates",
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
    { id: "introduction", title: "Introduction" },
    { id: "collection", title: "Information We Collect" },
    { id: "usage", title: "How We Use Your Data" },
    { id: "sharing", title: "Data Sharing" },
    { id: "storage", title: "Data Storage & Retention" },
    { id: "cookies", title: "Cookies & Tracking" },
    { id: "rights", title: "Your Privacy Rights" },
    { id: "security", title: "Data Security" },
    { id: "children", title: "Children's Privacy" },
    { id: "international", title: "International Users" },
    { id: "updates", title: "Policy Updates" },
    { id: "contact", title: "Contact Us" },
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Privacy{" "}
              <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Policy
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              Your privacy matters. Here&quot;s how we protect it.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: May 29, 2025
            </p>
          </div>
        </section>

        {/* Privacy Highlights */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Privacy at a{" "}
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  Glance
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                The key things you should know about how we handle your data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: "🛡️",
                  title: "We Don't Sell Data",
                  description:
                    "Your personal information is never sold to third parties. Period.",
                },
                {
                  icon: "🔒",
                  title: "Encrypted Storage",
                  description:
                    "All your data is encrypted both in transit and at rest using industry standards.",
                },
                {
                  icon: "👤",
                  title: "You Own Your Data",
                  description:
                    "Export or delete your data anytime. You're in complete control.",
                },
                {
                  icon: "🎯",
                  title: "Minimal Collection",
                  description:
                    "We only collect what's necessary to make Life Planner work for you.",
                },
              ].map((highlight, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl border border-green-100 dark:border-green-800/30 text-center transform hover:-translate-y-1 transition-all duration-300"
                  style={{
                    transform: `translateY(${
                      Math.sin((scrollY + index * 100) * 0.008) * 5
                    }px)`,
                  }}
                >
                  <div className="text-3xl mb-3">{highlight.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {highlight.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>
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

            {/* Privacy Content */}
            <div className="lg:w-3/4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-green-100 dark:border-green-800/30 overflow-hidden">
                <div className="p-8 lg:p-12 space-y-12">
                  {/* Introduction */}
                  <section id="introduction" className="scroll-mt-24">
                    <div className="text-center pb-8 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        We Respect Your Privacy
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                        At Life Planner, your privacy isn&apos;t just important
                        to us—it&apos;s fundamental to everything we do. This
                        policy explains how we collect, use, and protect your
                        personal information in clear, simple terms.
                      </p>
                    </div>
                  </section>

                  {/* Section 1 */}
                  <section id="collection" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        1
                      </span>
                      Information We Collect
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Account Information
                      </h3>
                      <p>When you create an account, we collect:</p>
                      <ul>
                        <li>Email address (for login and communication)</li>
                        <li>Username and display name</li>
                        <li>Profile picture (optional)</li>
                        <li>Password (encrypted and hashed)</li>
                      </ul>

                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
                        Content You Create
                      </h3>
                      <p>Your productivity data includes:</p>
                      <ul>
                        <li>Tasks, boards, and lists you create</li>
                        <li>Calendar events and scheduling data</li>
                        <li>Notes, comments, and descriptions</li>
                        <li>Focus session records and productivity metrics</li>
                        <li>Shared content and collaboration data</li>
                        <li>Archived memories and saved content</li>
                      </ul>

                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
                        Usage Information
                      </h3>
                      <p>To improve our service, we automatically collect:</p>
                      <ul>
                        <li>How you interact with Life Planner</li>
                        <li>Feature usage patterns and preferences</li>
                        <li>Device information and browser type</li>
                        <li>IP address and general location (city/region)</li>
                        <li>Login times and session duration</li>
                      </ul>
                    </div>
                  </section>

                  {/* Section 2 */}
                  <section id="usage" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        2
                      </span>
                      How We Use Your Data
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>We use your information to:</p>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800 my-6">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                          ✅ What We Do
                        </h4>
                        <ul className="space-y-2 mb-0">
                          <li>
                            Provide and maintain Life Planner&apos;s
                            functionality
                          </li>
                          <li>Sync your data across devices</li>
                          <li>Send important account and service updates</li>
                          <li>Provide customer support when you need help</li>
                          <li>Improve our service based on usage patterns</li>
                          <li>Ensure security and prevent abuse</li>
                        </ul>
                      </div>
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                        <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3">
                          ❌ What We Don&apos;t Do
                        </h4>
                        <ul className="space-y-2 mb-0">
                          <li>Sell your personal data to anyone</li>
                          <li>Share your content without permission</li>
                          <li>Use your data for advertising to you</li>
                          <li>
                            Read your private tasks or notes for marketing
                          </li>
                          <li>
                            Share data with third parties (except as required by
                            law)
                          </li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Section 3 */}
                  <section id="sharing" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        3
                      </span>
                      Data Sharing
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        We share your information only in these limited
                        circumstances:
                      </p>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        With Your Permission
                      </h3>
                      <ul>
                        <li>
                          When you explicitly share boards, tasks, or calendars
                          with others
                        </li>
                        <li>
                          When you collaborate with team members or family
                        </li>
                        <li>When you choose to make certain content public</li>
                      </ul>

                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
                        Service Providers
                      </h3>
                      <p>
                        We work with trusted partners who help us operate Life
                        Planner:
                      </p>
                      <ul>
                        <li>
                          Cloud hosting providers (for secure data storage)
                        </li>
                        <li>Payment processors (for subscription billing)</li>
                        <li>
                          Email service providers (for account notifications)
                        </li>
                        <li>Analytics tools (for anonymized usage insights)</li>
                      </ul>
                      <p>
                        <em>
                          These partners are contractually required to protect
                          your data and can only use it to provide services to
                          us.
                        </em>
                      </p>

                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
                        Legal Requirements
                      </h3>
                      <p>
                        We may disclose information if required by law, such as:
                      </p>
                      <ul>
                        <li>Valid court orders or subpoenas</li>
                        <li>Government investigations</li>
                        <li>
                          Protecting our rights or the safety of our users
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* Section 4 */}
                  <section id="storage" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        4
                      </span>
                      Data Storage & Retention
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Where We Store Your Data
                      </h3>
                      <p>Your data is stored securely in:</p>
                      <ul>
                        <li>
                          Industry-leading cloud infrastructure with 99.9%
                          uptime
                        </li>
                        <li>
                          Multiple data centers for redundancy and reliability
                        </li>
                        <li>
                          Encrypted databases with regular security audits
                        </li>
                        <li>Automated backups to prevent data loss</li>
                      </ul>

                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
                        How Long We Keep Your Data
                      </h3>
                      <ul>
                        <li>
                          <strong>Active accounts:</strong> Data is kept as long
                          as your account is active
                        </li>
                        <li>
                          <strong>Inactive accounts:</strong> Data is retained
                          for 2 years, then deleted
                        </li>
                        <li>
                          <strong>Deleted accounts:</strong> Data is permanently
                          deleted within 30 days
                        </li>
                        <li>
                          <strong>Legal holds:</strong> Some data may be
                          retained longer if required by law
                        </li>
                      </ul>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          💡 Pro Tip
                        </h4>
                        <p className="text-blue-700 dark:text-blue-300 mb-0">
                          You can export all your data anytime from your account
                          settings. We recommend doing this regularly as a
                          personal backup!
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Section 5 */}
                  <section id="cookies" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        5
                      </span>
                      Cookies & Tracking
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        We use cookies and similar technologies to make Life
                        Planner work better for you:
                      </p>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Essential Cookies
                      </h3>
                      <ul>
                        <li>Keep you logged in to your account</li>
                        <li>Remember your preferences and settings</li>
                        <li>Ensure security and prevent fraud</li>
                        <li>Enable core functionality like saving your work</li>
                      </ul>

                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
                        Analytics Cookies (Optional)
                      </h3>
                      <ul>
                        <li>Help us understand how people use Life Planner</li>
                        <li>Identify which features are most popular</li>
                        <li>Find and fix bugs or performance issues</li>
                        <li>Improve the user experience for everyone</li>
                      </ul>

                      <p>
                        <strong>You can control cookies:</strong> Most browsers
                        let you block or delete cookies. However, some essential
                        cookies are required for Life Planner to function
                        properly.
                      </p>
                    </div>
                  </section>

                  {/* Section 6 */}
                  <section id="rights" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        6
                      </span>
                      Your Privacy Rights
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        You have complete control over your personal data.
                        Here&apos;s what you can do:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                            📥 Access Your Data
                          </h4>
                          <p className="text-green-700 dark:text-green-300 mb-0">
                            Download a complete copy of all your information
                            anytime from your account settings.
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                            ✏️ Update Information
                          </h4>
                          <p className="text-blue-700 dark:text-blue-300 mb-0">
                            Edit your profile, preferences, and account details
                            whenever you want.
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                          <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
                            🚫 Opt Out
                          </h4>
                          <p className="text-purple-700 dark:text-purple-300 mb-0">
                            Disable optional features like analytics or
                            marketing emails in your settings.
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                          <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3">
                            🗑️ Delete Everything
                          </h4>
                          <p className="text-red-700 dark:text-red-300 mb-0">
                            Permanently delete your account and all associated
                            data with one click.
                          </p>
                        </div>
                      </div>

                      <p>
                        <strong>Need help with your privacy rights?</strong>{" "}
                        Contact us anytime at privacy@lifeplanner.app and
                        we&apos;ll respond within 48 hours.
                      </p>
                    </div>
                  </section>

                  {/* Section 7 */}
                  <section id="security" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        7
                      </span>
                      Data Security
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        We take security seriously and use multiple layers of
                        protection:
                      </p>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Technical Safeguards
                      </h3>
                      <ul>
                        <li>
                          <strong>Encryption:</strong> All data is encrypted in
                          transit (TLS 1.3) and at rest (AES-256)
                        </li>
                        <li>
                          <strong>Access controls:</strong> Strict permissions
                          and multi-factor authentication for our team
                        </li>
                        <li>
                          <strong>Regular audits:</strong> Third-party security
                          assessments and penetration testing
                        </li>
                        <li>
                          <strong>Monitoring:</strong> 24/7 threat detection and
                          incident response systems
                        </li>
                      </ul>

                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
                        What You Can Do
                      </h3>
                      <ul>
                        <li>
                          Use a strong, unique password for your Life Planner
                          account
                        </li>
                        <li>
                          Enable two-factor authentication in your security
                          settings
                        </li>
                        <li>Log out from shared or public devices</li>
                        <li>
                          Report any suspicious activity to our support team
                          immediately
                        </li>
                      </ul>

                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                          ⚠️ Security Incident?
                        </h4>
                        <p className="text-yellow-700 dark:text-yellow-300 mb-0">
                          If we ever experience a data breach, we&apos;ll notify
                          affected users within 72 hours and provide clear
                          information about what happened and what we&apos;re
                          doing about it.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Section 8 */}
                  <section id="children" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        8
                      </span>
                      Children&apos;s Privacy
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        Life Planner is designed for users aged 13 and older. We
                        do not knowingly collect personal information from
                        children under 13.
                      </p>
                      <p>
                        If we discover that we have collected information from a
                        child under 13, we will:
                      </p>
                      <ul>
                        <li>Delete the information immediately</li>
                        <li>Terminate the account</li>
                        <li>
                          Notify the parents if contact information is available
                        </li>
                      </ul>
                      <p>
                        Parents who believe their child has created an account
                        should contact us immediately at
                        privacy@lifeplanner.app.
                      </p>
                    </div>
                  </section>

                  {/* Section 9 */}
                  <section id="international" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        9
                      </span>
                      International Users
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        Life Planner is used by people around the world, and we
                        respect different privacy laws:
                      </p>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        GDPR (European Union)
                      </h3>
                      <p>
                        If you&apos;re in the EU, you have additional rights
                        under GDPR:
                      </p>
                      <ul>
                        <li>
                          Right to data portability (export your data in a
                          machine-readable format)
                        </li>
                        <li>
                          Right to object to processing for legitimate interests
                        </li>
                        <li>
                          Right to lodge a complaint with your local data
                          protection authority
                        </li>
                        <li>Right to withdraw consent at any time</li>
                      </ul>

                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
                        CCPA (California)
                      </h3>
                      <p>California residents have rights under the CCPA:</p>
                      <ul>
                        <li>
                          Right to know what personal information we collect and
                          why
                        </li>
                        <li>
                          Right to delete personal information (with some
                          exceptions)
                        </li>
                        <li>
                          Right to opt-out of the sale of personal information
                          (we don&apos;t sell data)
                        </li>
                        <li>
                          Right to non-discrimination for exercising your
                          privacy rights
                        </li>
                      </ul>

                      <p>
                        <strong>Data Transfers:</strong> Your data may be
                        processed in countries other than where you live. We
                        ensure appropriate safeguards are in place for
                        international transfers.
                      </p>
                    </div>
                  </section>

                  {/* Section 10 */}
                  <section id="updates" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        10
                      </span>
                      Policy Updates
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        We may update this privacy policy from time to time.
                        When we do, we&apos;ll:
                      </p>
                      <ul>
                        <li>
                          Update the &quot;Last updated&quot; date at the top of
                          this page
                        </li>
                        <li>
                          Send you an email notification if you have an account
                        </li>
                        <li>
                          Post a notice on our website for at least 30 days
                        </li>
                        <li>
                          For major changes, we&apos;ll ask for your consent
                          before they take effect
                        </li>
                      </ul>
                      <p>
                        We encourage you to review this policy periodically to
                        stay informed about how we protect your privacy.
                      </p>

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                          📬 Stay Informed
                        </h4>
                        <p className="text-green-700 dark:text-green-300 mb-0">
                          Want to know about privacy updates? Make sure your
                          email notifications are enabled in your account
                          settings!
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Section 11 */}
                  <section id="contact" className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">
                        11
                      </span>
                      Contact Us
                    </h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <p>
                        Questions about your privacy or this policy? We&apos;re
                        here to help!
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                        <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <svg
                              className="w-5 h-5 text-green-500 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            Privacy Team
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            For privacy-specific questions
                          </p>
                          <a
                            href="mailto:privacy@lifeplanner.app"
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                          >
                            privacy@lifeplanner.app
                          </a>
                        </div>

                        <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <svg
                              className="w-5 h-5 text-green-500 mr-2"
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
                            General Support
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            For other questions
                          </p>
                          <Link
                            href="/contact"
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                          >
                            Contact Form
                          </Link>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          <strong>Postal Address:</strong>
                        </p>
                        <address className="text-gray-600 dark:text-gray-300 not-italic">
                          Life Planner Privacy Team
                          <br />
                          123 Privacy Lane
                          <br />
                          Istanbul
                          <br />
                          Turkey
                        </address>
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                        <strong>Response Time:</strong> We typically respond to
                        privacy inquiries within 48 hours. For urgent matters,
                        please mark your email as &quot;URGENT PRIVACY
                        REQUEST&quot; in the subject line.
                      </p>
                    </div>
                  </section>
                </div>

                {/* Footer CTA */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Your Privacy Matters
                  </h3>
                  <p className="text-green-100 mb-4">
                    We&apos;re committed to protecting your data and being
                    transparent about how we use it.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                      <span>Ask Questions</span>
                    </Link>
                    <Link
                      href="/dashboard"
                      className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center space-x-2"
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
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <span>Start Planning Securely</span>
                    </Link>
                  </div>
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
                  href="/terms"
                  className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Terms
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

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
              <p>&copy; 2025 Life Planner. Privacy-first productivity. 🔒</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPage;
