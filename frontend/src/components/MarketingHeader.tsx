import { Link } from "react-router-dom";
import Brand from "./Brand";

const MarketingHeader = (): JSX.Element => (
  <header className="marketing-header">
    <div className="marketing-header__inner">
      <Brand />
      <nav className="marketing-header__nav">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#solutions">Solutions</a>
      </nav>
      <div className="marketing-header__actions">
        <a href="#auth-panel" className="button button--ghost">Log In</a>
        <a href="#auth-panel" className="button button--primary">Contact Us</a>
      </div>
    </div>
  </header>
);

export default MarketingHeader;

