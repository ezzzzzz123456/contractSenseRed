import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const DashboardTopbar = ({ title, subtitle }: { title: string; subtitle?: string }): JSX.Element => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="dashboard-topbar">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="dashboard-topbar__right">
        <label className="search-field">
          <span className="search-field__icon">S</span>
          <input type="search" placeholder="Search contracts, reports..." />
        </label>
        <Link to="/report" className="topbar-icon" aria-label="Open recent reports">R</Link>
        <div className="topbar-user">
          <div className="topbar-user__meta">
            <strong>{currentUser?.name ?? "Alex Rivera"}</strong>
            <span>{currentUser?.userType === "lawyer" ? "General Counsel" : "Business Workspace"}</span>
          </div>
          <button
            type="button"
            className="button button--glass dashboard-topbar__logout"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Log Out
          </button>
          <span className="avatar-badge">
            {(currentUser?.name ?? "AR")
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </span>
        </div>
      </div>
    </header>
  );
};

export default DashboardTopbar;
