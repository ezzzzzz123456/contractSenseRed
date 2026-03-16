import { Link } from "react-router-dom";

const Brand = ({ subtitle }: { subtitle?: string }): JSX.Element => (
  <Link to="/" className="brand">
    <span className="brand-mark" aria-hidden="true">
      <span className="brand-mark__diamond" />
      <span className="brand-mark__slash" />
    </span>
    <span>
      <strong className="brand-title">ContractSense</strong>
      {subtitle ? <span className="brand-subtitle">{subtitle}</span> : null}
    </span>
  </Link>
);

export default Brand;

