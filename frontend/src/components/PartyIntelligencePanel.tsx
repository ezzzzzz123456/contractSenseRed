import { useNavigate } from "react-router-dom";
import type { ContractorCredibilityReport, PartyIntelligence } from "../types";

const isCredibilityReport = (intel: PartyIntelligence | ContractorCredibilityReport | null | undefined): intel is ContractorCredibilityReport =>
  Boolean(intel && typeof intel === "object" && "positiveSignals" in intel);

const PartyIntelligencePanel = ({
  intel,
}: {
  intel?: PartyIntelligence | ContractorCredibilityReport | null;
}): JSX.Element => {
  const navigate = useNavigate();

  if (isCredibilityReport(intel)) {
    return (
      <section className="insight-panel">
        <h2>Counterparty Credibility</h2>
        <p>{intel.summary}</p>
        <ul className="insight-panel__list">
          {intel.positiveSignals.slice(0, 2).map((item) => (
            <li key={item}>{item}</li>
          ))}
          {intel.negativeSignals.slice(0, 2).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <button type="button" className="button button--primary insight-panel__button" onClick={() => navigate("/marketplace")}>
          Review with Legal Counsel
        </button>
      </section>
    );
  }

  return (
    <section className="insight-panel">
      <h2>Legal Professional Insight</h2>
      {intel ? <p>{intel.summary}</p> : <p>Based on your jurisdiction and the analyzed clause mix, several provisions may need negotiation before signature.</p>}
      <ul className="insight-panel__list">
        {(intel?.riskIndicators ?? [
          "Non-compete language may be unenforceable in restrictive jurisdictions.",
          "Payment timing and termination scope merit a lawyer review before execution.",
        ]).map((indicator) => (
          <li key={indicator}>{indicator}</li>
        ))}
      </ul>
      <button type="button" className="button button--primary insight-panel__button" onClick={() => navigate("/marketplace")}>
        Review with Legal Counsel
      </button>
    </section>
  );
};

export default PartyIntelligencePanel;
