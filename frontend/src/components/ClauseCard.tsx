import type { Clause } from "../types";
import RiskFlag from "./RiskFlag";

const ClauseCard = ({ clause }: { clause: Clause }): JSX.Element => (
  <article className="card">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3>Clause Review</h3>
      <RiskFlag value={clause.riskFlag} />
    </div>
    <p><strong>Original:</strong> {clause.text}</p>
    <p><strong>Simplified:</strong> {clause.simplifiedText}</p>
    <p><strong>Why it matters:</strong> {clause.explanation}</p>
    <p><strong>Suggested fallback:</strong> {clause.counterClauseSuggestion}</p>
  </article>
);

export default ClauseCard;

