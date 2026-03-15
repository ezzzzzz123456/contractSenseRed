import { Link } from "react-router-dom";

const Navbar = (): JSX.Element => (
  <nav className="card page-shell" style={{ display: "flex", justifyContent: "space-between" }}>
    <strong>ContractSense</strong>
    <div style={{ display: "flex", gap: "1rem" }}>
      <Link to="/">Auth</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/analysis">Analysis</Link>
      <Link to="/report">Report</Link>
      <Link to="/marketplace">Marketplace</Link>
    </div>
  </nav>
);

export default Navbar;

