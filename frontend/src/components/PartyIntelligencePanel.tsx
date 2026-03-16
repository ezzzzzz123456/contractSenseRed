import type { ContractorCredibilityReport } from "../types";


const PartyIntelligencePanel = ({ intel }: { intel?: ContractorCredibilityReport | null }): JSX.Element => (
  <section className="card">
    <h2>Counterparty credibility</h2>
    {intel ? (
      <>
        <p className="metric-value">{Math.round(intel.score)}/100</p>
        <p>{intel.summary}</p>
        <div className="dual-column">
          <div>
            <strong>Positive signals</strong>
            <ul>
              {intel.positiveSignals.length ? intel.positiveSignals.map((indicator) => (
                <li key={indicator}>{indicator}</li>
              )) : <li>No positive public indicators were supplied.</li>}
            </ul>
          </div>
          <div>
            <strong>Negative signals</strong>
            <ul>
              {intel.negativeSignals.length ? intel.negativeSignals.map((indicator) => (
                <li key={indicator}>{indicator}</li>
              )) : <li>No negative public indicators were supplied.</li>}
            </ul>
          </div>
        </div>
        <div>
          <strong>Sources</strong>
          <ul>
            {intel.sources.length ? intel.sources.map((source) => (
              <li key={source}>
                <a href={source} target="_blank" rel="noreferrer">{source}</a>
              </li>
            )) : <li>No public sources collected.</li>}
          </ul>
        </div>
      </>
    ) : (
      <p>Add a counterparty during upload to generate a credibility assessment.</p>
    )}
  </section>
);


export default PartyIntelligencePanel;
