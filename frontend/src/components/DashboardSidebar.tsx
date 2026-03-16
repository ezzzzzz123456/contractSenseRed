import { Link, useLocation } from "react-router-dom";
import Brand from "./Brand";

const navItems = [
  { label: "Dashboard", to: "/dashboard", badge: null, short: "D" },
  { label: "Reports", to: "/report", badge: null, short: "R" },
  { label: "My Contracts", to: "/analysis", badge: null, short: "C" },
];

const footerItems = [
  { label: "Settings", to: "/marketplace", short: "S" },
  { label: "Support", to: "/marketplace", short: "?" },
];

const DashboardSidebar = (): JSX.Element => {
  const location = useLocation();

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar__brand">
        <Brand subtitle="AI INTELLIGENCE" />
      </div>

      <nav className="dashboard-sidebar__nav">
        {navItems.map((item) => {
          const active = location.pathname === item.to;

          return (
            <Link key={item.to} to={item.to} className={`side-link${active ? " side-link--active" : ""}`}>
              <span className="side-link__icon">{item.short}</span>
              <span>{item.label}</span>
              {item.badge ? <span className="side-link__badge">{item.badge}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="dashboard-sidebar__footer">
        <section className="dashboard-sidebar__aux">
          {footerItems.map((item) => (
            <Link key={item.label} to={item.to} className="side-link side-link--footer">
              <span className="side-link__icon">{item.short}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </section>
        <section className="plan-card">
          <span className="eyebrow eyebrow--muted">usage</span>
          <h3>Pro Plan</h3>
          <p>85 of 100 contracts analyzed this month.</p>
          <div className="plan-card__track">
            <span className="plan-card__fill" />
          </div>
        </section>
      </div>
    </aside>
  );
};

export default DashboardSidebar;

