import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const DashboardTopbar = ({ title }: { title: string }): JSX.Element => {
  const { currentUser } = useAuth();

  return (
    <header className="dashboard-topbar">
      <h1>{title}</h1>
      <div className="dashboard-topbar__right">
        <label className="search-field">
          <span className="search-field__icon">Q</span>
          <input type="search" placeholder="Search contracts..." />
        </label>
        <Link to="/report" className="topbar-icon" aria-label="Open inbox and report history">B</Link>
        <div className="topbar-user">
          <div>
            <strong>{currentUser?.name ?? "Alex Rivera"}</strong>
            <span>{currentUser?.userType === "lawyer" ? "General Counsel" : "General Counsel"}</span>
          </div>
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
