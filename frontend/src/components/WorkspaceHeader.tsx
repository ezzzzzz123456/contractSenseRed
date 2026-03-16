import { Link, useLocation, useNavigate } from "react-router-dom";
import Brand from "./Brand";
import { useAuth } from "../hooks/useAuth";

const links = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Analysis", to: "/analysis" },
  { label: "Reports", to: "/report" },
  { label: "Legal Team", to: "/marketplace" },
];

const WorkspaceHeader = ({ actionLabel, actionTo }: { actionLabel?: string; actionTo?: string }): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <header className="workspace-header">
      <div className="workspace-header__inner">
        <Brand />
        <nav className="workspace-header__nav">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`workspace-link${location.pathname === link.to ? " workspace-link--active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="workspace-header__actions">
          {actionLabel ? (
            actionTo ? <Link to={actionTo} className="button button--primary">{actionLabel}</Link> : <button type="button" className="button button--primary">{actionLabel}</button>
          ) : null}
          <button
            type="button"
            className="button button--glass"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Log Out
          </button>
          <span className="avatar-badge">JD</span>
        </div>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
