import type { RiskFlagType } from "../types";

const colorMap: Record<RiskFlagType, string> = {
  red: "#cf3341",
  yellow: "#b58200",
  green: "#1e8a4c",
};

const labelMap: Record<RiskFlagType, string> = {
  red: "High Risk",
  yellow: "Med Risk",
  green: "Low Risk",
};

const RiskFlag = ({ value }: { value: RiskFlagType }): JSX.Element => (
  <span className="risk-pill" style={{ backgroundColor: `${colorMap[value]}18`, color: colorMap[value] }}>
    {labelMap[value]}
  </span>
);

export default RiskFlag;
