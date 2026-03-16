import { useState } from "react";
import type { Clause } from "../types";
import RiskFlag from "./RiskFlag";

const ClauseCard = ({ clause }: { clause: Clause }): JSX.Element => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(clause.counterClauseSuggestion);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className={`risk-card risk-card--${clause.riskFlag} lift-card`}>
      <header className="risk-card__header">
        <div>
          <div className="risk-card__title-row">
            <span className="risk-card__alert">{clause.riskFlag === "red" ? "!" : clause.riskFlag === "yellow" ? "i" : "v"}</span>
            <h3>{clause.text.slice(0, 42)}{clause.text.length > 42 ? "..." : ""}</h3>
          </div>
          <p>{clause.explanation}</p>
        </div>
        <RiskFlag value={clause.riskFlag} />
      </header>
      <blockquote className="risk-card__quote">{clause.simplifiedText}</blockquote>
      <div className="risk-card__counter">
        <span>Recommended Counter-clause</span>
        <p>{clause.counterClauseSuggestion}</p>
        <button type="button" className="button button--soft" onClick={() => void handleCopy()}>
          {copied ? "Copied" : "Copy Counter-clause"}
        </button>
      </div>
    </article>
  );
};

export default ClauseCard;
