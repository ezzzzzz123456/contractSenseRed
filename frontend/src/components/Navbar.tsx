import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Navbar = (): JSX.Element => {
  const { currentUser, logout } = useAuth();

  return (
    <nav className="card page-shell" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <strong>ContractSense</strong>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link to="/">Auth</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/analysis">Analysis</Link>
        <Link to="/report">Report</Link>
        <Link to="/marketplace">Marketplace</Link>
        {currentUser ? (
          <>
            <span>{currentUser.name}</span>
            <button type="button" onClick={logout}>Logout</button>
          </>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;
