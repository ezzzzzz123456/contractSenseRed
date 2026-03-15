import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserType } from "../types";

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
    <main className="page-shell">
      <section className="card" style={{ maxWidth: "520px", margin: "2rem auto" }}>
        <h1>{mode === "login" ? "Sign in to ContractSense" : "Create your ContractSense account"}</h1>
        <p>
          {mode === "login"
            ? "Access your contract reviews, reports, and lawyer workspace."
            : "Create a user or lawyer account to start reviewing contracts."}
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button type="button" onClick={() => setMode("login")} disabled={mode === "login"}>
            Login
          </button>
          <button type="button" onClick={() => setMode("register")} disabled={mode === "register"}>
            Register
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} style={{ display: "grid", gap: "0.85rem" }}>
          {mode === "register" ? (
            <label>
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} required={mode === "register"} />
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
            Account type
            <select value={userType} onChange={(event) => setUserType(event.target.value as UserType)}>
              <option value="user">Business User</option>
              <option value="lawyer">Lawyer</option>
            </select>
          </label>

          {error ? <p style={{ color: "#cf3341", margin: 0 }}>{error}</p> : null}

          <button type="submit" disabled={submitting || isLoading}>
            {submitting ? "Submitting..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default AuthPage;
