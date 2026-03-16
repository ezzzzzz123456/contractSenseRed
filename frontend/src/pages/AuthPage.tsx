import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import MarketingHeader from "../components/MarketingHeader";
import { useAuth } from "../hooks/useAuth";
import type { UserType } from "../types";

const features = [
  {
    title: "Secure storage",
    body: "Keep agreements organized in one clean workspace with easy upload and review flows.",
  },
  {
    title: "AI analysis",
    body: "Detect risk, simplify legal text, and generate readable outputs for non-legal users.",
  },
  {
    title: "Lawyer review",
    body: "Escalate important reports to lawyers when human review is needed before signature.",
  },
];

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
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

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
    <div className="marketing-page marketing-page--reference">
      <div className={`intro-splash${showIntro ? "" : " intro-splash--hidden"}`} aria-hidden={!showIntro}>
        <div className="intro-splash__core">
          <span className="intro-splash__ring intro-splash__ring--outer" />
          <span className="intro-splash__ring intro-splash__ring--inner" />
          <div className="intro-splash__mark">CS</div>
        </div>
        <p>Opening ContractSense</p>
      </div>

      <MarketingHeader />

      <main className="page-fade-in">
        <section className="landing-hero landing-hero--simple">
          <div className="landing-hero__copy">
            <span className="eyebrow">NEXT-GEN LEGAL TECH</span>
            <h1>
              Intelligent
              <br />
              Contract
              <br />
              Management for
              <br />
              Everyone
            </h1>
            <p>
              ContractSense helps users upload contracts, understand risks, review reports, and consult the right lawyer
              only when it is needed.
            </p>
            <div className="landing-hero__actions">
              <a href="#auth-panel" className="button button--primary">Get Started Free</a>
              <a href="#features" className="button button--glass">View Features</a>
            </div>
          </div>

          <div className="landing-hero__visual">
            <div className="landing-window lift-card">
              <div className="landing-window__toolbar">
                <span />
                <span />
                <span />
              </div>
              <div className="landing-window__app">
                <div className="landing-window__sidebar" />
                <div className="landing-window__panel">
                  <div className="landing-window__search" />
                  <div className="landing-window__cards">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="landing-window__list">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-features" id="features">
          <div className="section-heading">
            <h2>Powerful features for modern legal work</h2>
            <p>Everything important is kept simple: upload, analyze, review, and consult when needed.</p>
          </div>
          <div className="feature-grid feature-grid--landing">
            {features.map((feature) => (
              <article key={feature.title} className="feature-card feature-card--landing lift-card">
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="auth-panel-section" id="auth-panel">
          <div className="auth-panel card lift-card">
            <div className="auth-panel__copy">
              <span className="eyebrow">PORTAL ACCESS</span>
              <h2>{mode === "login" ? "Sign in to your workspace" : "Create your account"}</h2>
              <p>Select whether you are logging in as a user or lawyer directly in the form below.</p>
              <div className="auth-panel__switches">
                <button type="button" className={`button ${mode === "login" ? "button--primary" : "button--glass"}`} onClick={() => setMode("login")}>
                  Log In
                </button>
                <button type="button" className={`button ${mode === "register" ? "button--primary" : "button--glass"}`} onClick={() => setMode("register")}>
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
                Login As
                <select value={userType} onChange={(event) => setUserType(event.target.value as UserType)}>
                  <option value="user">User</option>
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
    </div>
  );
};

export default AuthPage;
