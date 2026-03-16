import { Link } from "react-router-dom";
import Brand from "./Brand";

const MarketingHeader = (): JSX.Element => (
  <header className="marketing-header">
    <div className="marketing-header__inner">
      <Brand />
      <nav className="marketing-header__nav">
        <a href="#features">Features</a>
        <a href="#solutions">Solutions</a>
        <a href="#auth-panel">Portal Access</a>
      </nav>
      <div className="marketing-header__actions">
        <a href="#auth-panel" className="button button--glass">Log In</a>
        <a href="#auth-panel" className="button button--primary">Get Started Free</a>
      </div>
    </div>
  </header>
);

export default MarketingHeader;

