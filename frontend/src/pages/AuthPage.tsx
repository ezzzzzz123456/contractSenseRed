import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Brand from "../components/Brand";
import LawyerCard from "../components/LawyerCard";
import MarketingHeader from "../components/MarketingHeader";
import { useAuth } from "../hooks/useAuth";
import type { Lawyer, UserType } from "../types";

const demoLawyer: Lawyer = {
  userId: "lawyer-demo",
  specializations: ["AI-powered clause analysis", "Batch processing & bulk actions"],
  isVerified: true,
  ratings: 4.9,
  feePerReview: 299,
};

const AuthPage = (): JSX.Element => {
  const { currentUser, isLoading, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("user");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && currentUser) {
      navigate(currentUser.userType === "lawyer" ? "/lawyers/dashboard" : "/dashboard");
    }
  }, [currentUser, isLoading, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({ name, email, password, userType });
      }
    } catch (requestError) {
      const fallback = mode === "login" ? "Unable to sign in right now." : "Unable to create your account right now.";
      setError(requestError instanceof Error ? requestError.message : fallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="marketing-page">
      <MarketingHeader />
      <main>
        <section className="hero-section">
          <div className="hero-section__copy">
            <span className="eyebrow">NEXT-GEN LEGAL AI</span>
            <h1>
              Intelligent
              <br />
              Contract
              <br />
              Management <span>for Everyone</span>
            </h1>
            <p>
              ContractSense uses AI to streamline legal workflows, whether you are managing personal agreements or
              complex high-stakes firm cases.
            </p>
            <div className="hero-section__actions">
              <a href="#auth-panel" className="button button--primary">Get Started Free</a>
              <a href="#solutions" className="button button--ghost">View Demo</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-visual__photo" />
          </div>
        </section>

        <section className="experience-section" id="solutions">
          <div className="section-heading">
            <h2>Choose your experience</h2>
            <p>
              We've tailored ContractSense to fit your specific needs, providing specialized toolsets for both
              individuals and legal professionals.
            </p>
          </div>

          <div className="portal-grid">
            <article className="portal-card">
              <div className="portal-card__media portal-card__media--user" />
              <div className="portal-card__icon">U</div>
              <h3>I am a User</h3>
              <p>Manage your personal contracts, rent agreements, and digital signatures with ease.</p>
              <ul className="portal-card__list">
                <li>Simple, intuitive dashboard</li>
                <li>Unlimited electronic signatures</li>
                <li>Automated renewal alerts</li>
              </ul>
              <button
                type="button"
                className="button button--secondary button--block"
                onClick={() => {
                  setUserType("user");
                  setMode("register");
                  document.getElementById("auth-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Select User Portal
              </button>
            </article>

            <LawyerCard lawyer={demoLawyer} />
          </div>
        </section>

        <section className="security-section" id="features">
          <div className="section-heading">
            <h2>Built for Security and Precision</h2>
            <p>Our platform combines enterprise-level security with specialized legal intelligence.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-card__icon">S</span>
              <h3>Secure Storage</h3>
              <p>Bank-grade AES-256 encryption protects all your sensitive legal documents and communications.</p>
            </article>
            <article className="feature-card">
              <span className="feature-card__icon">A</span>
              <h3>AI Analysis</h3>
              <p>Automatically identify risks, anomalies, and key clauses in seconds with proprietary LLM models.</p>
            </article>
            <article className="feature-card">
              <span className="feature-card__icon">C</span>
              <h3>Collaboration</h3>
              <p>Work together with clients or firm colleagues in real-time with granular permission control.</p>
            </article>
          </div>
        </section>

        <section className="auth-panel-section" id="auth-panel">
          <div className="auth-panel card">
            <div>
              <span className="eyebrow">PORTAL ACCESS</span>
              <h2>{mode === "login" ? "Log in to your workspace" : "Create your ContractSense account"}</h2>
              <p>
                {mode === "login"
                  ? "Continue to your dashboard, active analyses, and generated reports."
                  : "Start as a business user or lawyer and unlock the full legal workflow suite."}
              </p>
              <div className="auth-panel__switches">
                <button type="button" className={`button ${mode === "login" ? "button--primary" : "button--ghost"}`} onClick={() => setMode("login")}>
                  Log In
                </button>
                <button type="button" className={`button ${mode === "register" ? "button--primary" : "button--ghost"}`} onClick={() => setMode("register")}>
                  Register
                </button>
              </div>
            </div>

            <form onSubmit={(event) => void handleSubmit(event)} className="auth-form">
              {mode === "register" ? (
                <label>
                  Full Name
                  <input value={name} onChange={(event) => setName(event.target.value)} required />
                </label>
              ) : null}
              <label>
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>
              <label>
                Account Type
                <select value={userType} onChange={(event) => setUserType(event.target.value as UserType)}>
                  <option value="user">Business User</option>
                  <option value="lawyer">Lawyer</option>
                </select>
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <button type="submit" className="button button--primary button--block" disabled={submitting || isLoading}>
                {submitting ? "Submitting..." : mode === "login" ? "Log In" : "Create Account"}
              </button>
            </form>
          </div>
        </section>
      </main>
      <footer className="marketing-footer" id="pricing">
        <Brand />
        <div>
          <a href="#auth-panel">Privacy Policy</a>
          <a href="#auth-panel">Terms of Service</a>
          <a href="#auth-panel">Compliance</a>
        </div>
        <span>&copy; 2024 ContractSense Legal Tech. All rights reserved.</span>
      </footer>
    </div>
  );
};

export default AuthPage;
