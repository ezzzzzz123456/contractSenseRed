import { Link, useLocation } from "react-router-dom";
import Brand from "./Brand";

const links = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Documents", to: "/dashboard" },
  { label: "Analysis", to: "/analysis" },
  { label: "History", to: "/report" },
];

const WorkspaceHeader = ({ actionLabel, actionTo }: { actionLabel?: string; actionTo?: string }): JSX.Element => {
  const location = useLocation();

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
          <span className="avatar-badge">JD</span>
        </div>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
