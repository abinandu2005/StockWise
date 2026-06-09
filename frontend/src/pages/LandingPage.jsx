import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import "./LandingPage.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Check,
  Package,
  Zap,
  BarChart3,
  ShieldCheck,
  Clock,
  Users,
  Menu,
  X,
} from "lucide-react";

/* ──────────────────────── data ──────────────────────── */

const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Real-Time Tracking",
    desc: "Experience seamless stock flow tracking with instant quantity updates across all locations.",
    link: "Discover More Features",
  },
  {
    icon: Clock,
    title: "Automated Alerts",
    desc: "Stay ahead with smart alerts for low stock levels, preventing order delays and shortages.",
    link: "Learn About Alerts",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    desc: "Gain actionable insights. Visualize margin reports, calculate total valuations, and optimize stock levels.",
    link: "Explore Analytics",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    desc: "Keep records safe with strict role-based access controls, comprehensive audit logs, and secure authentication.",
    link: "See Security Features",
  },
  {
    icon: Package,
    title: "Order Pipelines",
    desc: "Create and dispatch purchase orders or customer sales orders with one click, automatically updating inventory counts.",
    link: "View Order Tools",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    desc: "Empower staff, purchase managers, and administrators with specialized system views tailored to their duties.",
    link: "Learn About Teams",
  },
];

const PLANS = {
  monthly: [
    {
      name: "Basic",
      price: "$8",
      original: "$29.99 per month",
      desc: "Perfect for single warehouses and startup inventories.",
      features: [
        "Up to 500 Products",
        "Single Warehouse",
        "Standard Analytics",
        "Email Support",
        "Real-Time Updates",
      ],
      cta: "Get Started Now",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$16",
      original: "$99.99 per month",
      desc: "Designed for expanding businesses and distributed teams.",
      features: [
        "Unlimited Products",
        "Multi-Warehouse Management",
        "Role-Based User Permissions",
        "Advanced PDF/Excel Reports",
        "Priority Support",
        "Supplier & PO Automation",
      ],
      cta: "Start 14-Day Free Trial",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      original: "",
      desc: "Tailored options for global logistics and complex workflows.",
      features: [
        "Custom Feature Development",
        "Dedicated Account Director",
        "Full REST API Access",
        "Audit Log Archives",
        "24/7 Phone Support",
        "Custom Training Programs",
      ],
      cta: "Contact Us Today",
      highlight: false,
    },
  ],
  yearly: [
    {
      name: "Basic",
      price: "$72",
      original: "$299.99 per year",
      desc: "Perfect for single warehouses and startup inventories.",
      features: [
        "Up to 500 Products",
        "Single Warehouse",
        "Standard Analytics",
        "Email Support",
        "Real-Time Updates",
      ],
      cta: "Get Started Now",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$144",
      original: "$999.99 per year",
      desc: "Designed for expanding businesses and distributed teams.",
      features: [
        "Unlimited Products",
        "Multi-Warehouse Management",
        "Role-Based User Permissions",
        "Advanced PDF/Excel Reports",
        "Priority Support",
        "Supplier & PO Automation",
      ],
      cta: "Start 14-Day Free Trial",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      original: "",
      desc: "Tailored options for global logistics and complex workflows.",
      features: [
        "Custom Feature Development",
        "Dedicated Account Director",
        "Full REST API Access",
        "Audit Log Archives",
        "24/7 Phone Support",
        "Custom Training Programs",
      ],
      cta: "Contact Us Today",
      highlight: false,
    },
  ],
};

const FAQS = [
  {
    q: "How does the role-based security system protect data?",
    a: "We restrict actions based on roles Staff handle stock scans and adjustments, Purchase Managers coordinate supplier relationships and POs, while Admins retain exclusive access to global valuation, warehouse additions, and audit trails.",
  },
  {
    q: "Can I import existing spreadsheets into the inventory?",
    a: "Yes! The system includes a robust Import utility. You can upload standard CSV spreadsheets to instantly seed or update your inventory catalog.",
  },
  {
    q: "Are reports available for export in multiple formats?",
    a: "Absolutely. You can download dynamic financial datasets to Excel spreadsheets or generate clean, print-ready PDF reports of inventory levels and margins.",
  },
  {
    q: "How do purchase orders affect inventory counts?",
    a: "When a purchase order is completed inside the app, the system automatically imports those order quantities directly into your active product stocks, eliminating manual re-entry.",
  },
];

/* ──────────────────── components ─────────────────────── */

function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const goToLogin = () => {
    if (isAuthenticated) logout();
    navigate("/login");
  };

  const goToRegister = () => {
    if (isAuthenticated) logout();
    navigate("/register");
  };

  return (
    <header className="landing-navbar">
      <div className="landing-navbar__inner">
        {/* Logo */}
        <Link to="/" className="landing-navbar__logo">
          <img src="/logo.png" alt="StockWise" className="landing-navbar__logo-img" />
          <div className="landing-navbar__logo-text">
            <span className="landing-navbar__brand">STOCKWISE</span>
            <span className="landing-navbar__tagline">Inventory Management System</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="landing-navbar__nav">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="landing-navbar__link">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="landing-navbar__actions">
          {isAuthenticated ? (
            <>
              <button onClick={() => navigate("/dashboard")} className="landing-btn landing-btn--outline" id="nav-dashboard-btn">
                Dashboard
              </button>
              <button onClick={goToLogin} className="landing-btn landing-btn--primary" id="nav-switch-btn">
                Switch Account
              </button>
            </>
          ) : (
            <>
              <button onClick={goToLogin} className="landing-btn landing-btn--outline" id="nav-login-btn">
                Login
              </button>
              <button onClick={goToRegister} className="landing-btn landing-btn--primary" id="nav-signup-btn">
                Signup
              </button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="landing-navbar__hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="landing-navbar__mobile"
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="landing-navbar__mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="landing-navbar__mobile-actions">
              {isAuthenticated ? (
                <>
                  <button onClick={() => { setMobileOpen(false); navigate("/dashboard"); }} className="landing-btn landing-btn--outline w-full">
                    Dashboard
                  </button>
                  <button onClick={() => { setMobileOpen(false); goToLogin(); }} className="landing-btn landing-btn--primary w-full">
                    Switch Account
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setMobileOpen(false); goToLogin(); }} className="landing-btn landing-btn--outline w-full">
                    Login
                  </button>
                  <button onClick={() => { setMobileOpen(false); goToRegister(); }} className="landing-btn landing-btn--primary w-full">
                    Signup
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`faq-item ${open ? "faq-item--open" : ""}`}>
      <button className="faq-item__trigger" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <ChevronDown
          size={20}
          className={`faq-item__icon ${open ? "faq-item__icon--open" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="faq-item__body"
          >
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────── main page ──────────────────────── */

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="landing-page">
      <LandingNavbar />

      {/* ═══════════ HERO ═══════════ */}
      <section id="hero" className="hero">
        <div className="hero__bg">
          <img src="/warehouse-hero.png" alt="" />
          <div className="hero__overlay" />
        </div>
        <div className="hero__content">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero__title"
          >
            Simple <span className="hero__highlight">Inventory</span>
            <br />
            Management Software.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="hero__subtitle"
          >
            The best inventory software for small businesses to manage their
            physical inventory, including supplies, materials, tools, and equipment.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hero__actions"
          >
            <button
              className="landing-btn landing-btn--primary landing-btn--lg"
              id="hero-get-started-btn"
              onClick={() => {
                if (isAuthenticated) { navigate("/dashboard"); }
                else { navigate("/login"); }
              }}
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
            </button>
            <a
              href="#pricing"
              className="landing-btn landing-btn--outline landing-btn--lg"
              id="hero-see-plans-btn"
            >
              See All Plans
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FEATURES HEADER ═══════════ */}
      <section id="features" className="features-section">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-subtitle">
              Powerful tools designed to simplify catalog tracking and logistics.
            </p>
          </motion.div>

          {/* Feature Rows */}
          <div className="features-grid">
            <div className="features-grid__left">
              <h3 className="features-grid__heading">
                Revolutionize Your Inventory
                <br />
                Management
              </h3>
              {FEATURES.slice(0, 2).map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="feature-card-inline"
                >
                  <div className="feature-card-inline__icon">
                    <f.icon size={20} />
                  </div>
                  <div>
                    <h4 className="feature-card-inline__title">{f.title}</h4>
                    <p className="feature-card-inline__desc">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="features-grid__right">
              <img
                src="/dashboard-preview.png"
                alt="Dashboard Preview"
                className="features-grid__img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRANSFORM SECTION ═══════════ */}
      <section className="transform-section">
        <div className="section-container">
          <div className="transform-row">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="transform-row__img-wrap"
            >
              <img
                src="/worker-tablet.png"
                alt="Worker checking inventory"
                className="transform-row__img"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="transform-row__content"
            >
              <h2 className="transform-row__title">
                Take Control of Your Warehouses Today
              </h2>
              <p className="transform-row__desc">
                Streamline operations with our intuitive panel built for efficiency.
                Log stock movement in/out, create supplier pipelines, and audit system activities.
              </p>
              <div className="transform-row__actions">
                <a href="#features" className="landing-btn landing-btn--outline">
                  Discover More Features
                </a>
                <button
                  className="landing-btn landing-btn--primary"
                  onClick={() => {
                    if (isAuthenticated) logout();
                    navigate("/register");
                  }}
                >
                  Start Your Free Trial
                </button>
              </div>
              <div className="transform-row__social-proof">
                <div className="avatar-stack">
                  <div className="avatar-stack__item" style={{ background: "#2563eb" }}>AM</div>
                  <div className="avatar-stack__item" style={{ background: "#475569" }}>JW</div>
                  <div className="avatar-stack__item" style={{ background: "#0f172a" }}>TR</div>
                </div>
                <p>
                  Specialized roles for Admin, Purchase Managers, and Warehouse Staff.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ ADDITIONAL FEATURES GRID ═══════════ */}
      <section className="extra-features-section">
        <div className="section-container">
          <div className="extra-features-grid">
            {FEATURES.slice(2).map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="feature-card"
              >
                <div className="feature-card__icon">
                  <f.icon size={22} />
                </div>
                <h4 className="feature-card__title">{f.title}</h4>
                <p className="feature-card__desc">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="pricing-section">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h2 className="section-title">Flexible Pricing Plans</h2>
            <p className="section-subtitle">
              Choose the perfect plan that fits your needs and budget.
            </p>
          </motion.div>

          {/* Toggle */}
          <div className="pricing-toggle">
            <button
              className={`pricing-toggle__btn ${billingCycle === "monthly" ? "pricing-toggle__btn--active" : ""}`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly Plan
            </button>
            <button
              className={`pricing-toggle__btn ${billingCycle === "yearly" ? "pricing-toggle__btn--active" : ""}`}
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly Plan
            </button>
          </div>

          {/* Cards */}
          <div className="pricing-cards">
            {PLANS[billingCycle].map((plan, idx) => (
              <motion.div
                key={plan.name + billingCycle}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`pricing-card ${plan.highlight ? "pricing-card--highlight" : ""}`}
              >
                <span className={`pricing-card__badge ${plan.highlight ? "pricing-card__badge--highlight" : ""}`}>
                  {plan.name}
                </span>
                <div className="pricing-card__price">
                  <span className="pricing-card__amount">{plan.price}</span>
                  {plan.original && (
                    <span className="pricing-card__original">{plan.original}</span>
                  )}
                </div>
                <p className="pricing-card__desc">{plan.desc}</p>
                <ul className="pricing-card__features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <Check size={16} className="pricing-card__check" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`landing-btn ${plan.highlight ? "landing-btn--primary" : "landing-btn--outline"} landing-btn--full`}
                  onClick={() => {
                    if (isAuthenticated) logout();
                    navigate("/login");
                  }}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="faq-section">
        <div className="section-container section-container--narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Common queries about StockWise</p>
          </motion.div>

          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer id="footer" className="landing-footer" style={{ minHeight: "auto", display: "block" }}>
        <div className="landing-footer__bg">
          <img src="/worker-tablet.png" alt="Warehouse operations background" />
          <div className="landing-footer__overlay" />
        </div>
        <div className="landing-footer__content relative z-10 p-8 md:p-16 text-white max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
            <div className="space-y-4">
              <span className="landing-footer__brand text-xl font-bold tracking-wider text-primary">STOCKWISE</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Empowering businesses to manage supplies, orders, and logistics efficiently with real-time tracking and role security.
              </p>
              <p className="text-xs text-slate-300 font-semibold">stockwise@inventorysystem.com</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing Plans</a></li>
                <li><a href="#faq" className="hover:text-primary transition-colors">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Company</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="landing-footer__bottom border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} StockWise. All rights reserved.</p>
            <div className="landing-footer__socials flex gap-4 m-0">
              <a href="#" aria-label="Facebook" className="hover:text-primary transition-colors text-slate-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-primary transition-colors text-slate-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="hover:text-primary transition-colors text-slate-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
