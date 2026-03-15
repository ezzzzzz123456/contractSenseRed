import type { RiskFlagType } from "../types";

const colorMap: Record<RiskFlagType, string> = {
  red: "#cf3341",
  yellow: "#b58200",
  green: "#1e8a4c",
};

const RiskFlag = ({ value }: { value: RiskFlagType }): JSX.Element => (
  <span
    style={{
      display: "inline-block",
      padding: "0.25rem 0.65rem",
      borderRadius: 9999,
      backgroundColor: `${colorMap[value]}18`,
      color: colorMap[value],
      fontWeight: 700,
      textTransform: "uppercase",
    }}
  >
    {value}
  </span>
);

export default RiskFlag;

