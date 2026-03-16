import ClauseCard from "../components/ClauseCard";
import ExtractedDocumentPanel from "../components/ExtractedDocumentPanel";
import OutcomeSimulatorChat from "../components/OutcomeSimulatorChat";
import PartyIntelligencePanel from "../components/PartyIntelligencePanel";
import { useReport } from "../hooks/useReport";
import type { Clause } from "../types";


const ContractAnalysisPage = (): JSX.Element => {
  const { activeAnalysis } = useReport();

  if (!activeAnalysis) {
    return (
      <main className="page-shell grid">
        <section className="card">
          <h1>Contract Analysis</h1>
          <p>Upload a contract from the dashboard to generate a clause-by-clause intelligence report.</p>
        </section>
      </main>
    );
  }

  const clauses: Clause[] = activeAnalysis.clauses.map((clause) => ({
    clauseId: clause.clauseId,
    sectionReference: clause.sectionReference,
    title: clause.title,
    text: clause.originalText,
    simplifiedText: clause.plainLanguage,
    riskFlag: clause.colorIndicator,
    explanation: clause.explanation,
    counterClauseSuggestion: clause.improvement.revisedClause,
    riskScore: clause.riskScore,
    riskCategory: clause.riskCategory,
    recommendations: clause.recommendations,
    loopholes: clause.loopholes,
    legalScenarios: clause.legalScenarios,
    courtroomAssessment: clause.courtroomAssessment,
    negotiationDraft: clause.negotiation.draftedResponse,
    improvementJustification: clause.improvement.justification,
  }));

  return (
    <main className="page-shell grid analysis-layout">
      <section className="card hero-card">
        <p className="eyebrow">Analyzed contract</p>
        <h1>{activeAnalysis.contractType.category}</h1>
        <p>{activeAnalysis.summary}</p>
        <div className="metric-grid">
          <div className="metric-card">
            <span>Overall risk</span>
            <strong>{Math.round(activeAnalysis.overallRiskScore)}/100</strong>
          </div>
          <div className="metric-card">
            <span>Critical clauses</span>
            <strong>{Math.round(activeAnalysis.metrics.criticalClauseRatio * 100)}%</strong>
          </div>
          <div className="metric-card">
            <span>Fairness index</span>
            <strong>{Math.round(activeAnalysis.metrics.fairnessIndex)}</strong>
          </div>
          <div className="metric-card">
            <span>Legal exposure</span>
            <strong>{Math.round(activeAnalysis.metrics.legalExposureIndex)}</strong>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Major vulnerabilities</h2>
        <ul>
          {activeAnalysis.keyVulnerabilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Executive legal summary</h2>
        <p>{activeAnalysis.executiveLegalSummary}</p>
        <h3>Priority actions</h3>
        <ul>
          {activeAnalysis.priorityActions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <ExtractedDocumentPanel report={activeAnalysis} />

      <PartyIntelligencePanel intel={activeAnalysis.contractorCredibility} />
      <OutcomeSimulatorChat contractId={activeAnalysis.contractId} />

      <section className="grid">
        <h2>Clause-by-clause review</h2>
        {clauses.map((clause) => (
          <ClauseCard key={clause.clauseId} clause={clause} />
        ))}
      </section>
    </main>
  );
};


export default ContractAnalysisPage;
