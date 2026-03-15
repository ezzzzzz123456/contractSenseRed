import type { PartyIntelligence } from "../types";

const PartyIntelligencePanel = ({ intel }: { intel?: PartyIntelligence }): JSX.Element => (
  <section className="card">
    <h2>Party Intelligence</h2>
    {intel ? (
      <>
        <p>{intel.summary}</p>
        <ul>
          {intel.riskIndicators.map((indicator) => (
            <li key={indicator}>{indicator}</li>
          ))}
        </ul>
      </>
    ) : (
      <p>TODO: fetch and render counterparty intelligence.</p>
    )}
  </section>
);

export default PartyIntelligencePanel;

