import { Link, useLocation } from "react-router-dom";
import Brand from "./Brand";

const navItems = [
  { label: "Home", to: "/dashboard", badge: null, short: "H" },
  { label: "Marketplace", to: "/marketplace", badge: null, short: "M" },
  { label: "Inbox", to: "/report", badge: "12", short: "I" },
  { label: "Settings", to: "/analysis", badge: null, short: "S" },
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

      <section className="plan-card">
        <h3>Pro Plan</h3>
        <p>85/100 contracts analyzed this month.</p>
        <div className="plan-card__track">
          <span className="plan-card__fill" />
        </div>
      </section>
    </aside>
  );
};

export default DashboardSidebar;

