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
    <article className={`risk-card risk-card--${clause.riskFlag}`}>
      <header className="risk-card__header">
        <div>
          <div className="risk-card__title-row">
            <span className="risk-card__alert">{clause.riskFlag === "red" ? "!" : clause.riskFlag === "yellow" ? "i" : "v"}</span>
            <h3>{(clause.title ?? clause.text).slice(0, 42)}{(clause.title ?? clause.text).length > 42 ? "..." : ""}</h3>
          </div>
          <p>{clause.explanation}</p>
          {clause.sectionReference ? <p><strong>{clause.sectionReference}</strong></p> : null}
          {typeof clause.riskScore === "number" ? <p><strong>Risk Score:</strong> {Math.round(clause.riskScore)}/100</p> : null}
        </div>
        <RiskFlag value={clause.riskFlag} />
      </header>
      <blockquote className="risk-card__quote">{clause.simplifiedText}</blockquote>
      {clause.courtroomAssessment ? (
        <div className="risk-card__counter">
          <span>Courtroom Perspective</span>
          <p><strong>Judge View:</strong> {clause.courtroomAssessment.judgeView}</p>
          <p><strong>Likely Ruling:</strong> {clause.courtroomAssessment.likelyRuling}</p>
          <p><strong>Business Impact:</strong> {clause.courtroomAssessment.businessImpact}</p>
        </div>
      ) : null}
      {clause.recommendations?.length ? (
        <div className="risk-card__counter">
          <span>Recommendations</span>
          <p>{clause.recommendations.slice(0, 3).join(" | ")}</p>
        </div>
      ) : null}
      <div className="risk-card__counter">
        <span>Recommended Counter-clause</span>
        <p>{clause.counterClauseSuggestion}</p>
        {clause.improvementJustification ? <p><strong>Why:</strong> {clause.improvementJustification}</p> : null}
        {clause.negotiationDraft ? <p><strong>Negotiation Draft:</strong> {clause.negotiationDraft}</p> : null}
        <button type="button" className="button button--soft" onClick={() => void handleCopy()}>
          {copied ? "Copied" : "Copy Counter-clause"}
        </button>
      </div>
    </article>
  );
};

export default ClauseCard;
