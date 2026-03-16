import ExtractedDocumentPanel from "../components/ExtractedDocumentPanel";
import ReportExportButton from "../components/ReportExportButton";
import { useReport } from "../hooks/useReport";


const ReportPage = (): JSX.Element => {
  const { activeAnalysis } = useReport();

  if (!activeAnalysis) {
    return (
      <main className="page-shell grid">
        <section className="card">
          <h1>Report</h1>
          <p>No active report is loaded yet. Upload a contract to generate the full contract intelligence report.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell grid">
      <section className="card hero-card">
        <p className="eyebrow">Contract intelligence report</p>
        <h1>{activeAnalysis.contractType.category}</h1>
        <p>{activeAnalysis.summary}</p>
        <p><strong>Executive legal summary:</strong> {activeAnalysis.executiveLegalSummary}</p>
        <div className="report-toolbar">
          <ReportExportButton />
          <span className="badge">{activeAnalysis.extraction.documentKind}</span>
        </div>
      </section>

      <section className="card">
        <h2>Priority actions</h2>
        <ul>
          {activeAnalysis.priorityActions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Legal findings</h2>
        <ul>
          {activeAnalysis.reportFindings.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Recommendations</h2>
        <ul>
          {activeAnalysis.recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <ExtractedDocumentPanel report={activeAnalysis} />

      <section className="card">
        <h2>Extraction quality</h2>
        <p>
          <strong>Method:</strong> {activeAnalysis.extraction.extractionMethod}
        </p>
        <p>
          <strong>Structure confidence:</strong> {Math.round(activeAnalysis.extraction.structureConfidence * 100)}%
        </p>
        <p>
          <strong>Characters extracted:</strong> {activeAnalysis.extraction.extractedCharacters}
        </p>
        <p>
          <strong>Structured pages:</strong> {activeAnalysis.extraction.structuredPages}
        </p>
        <p>
          <strong>Layout elements:</strong> {activeAnalysis.extraction.layoutElements}
        </p>
        <p>
          <strong>Preview:</strong> {activeAnalysis.extraction.textPreview || "No preview available."}
        </p>
        <ul>
          {activeAnalysis.extraction.notes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Loopholes and illegal clause alerts</h2>
        <div className="dual-column">
          <div>
            <strong>Loopholes</strong>
            <ul>
              {activeAnalysis.legalLoopholes.length ? activeAnalysis.legalLoopholes.map((item) => (
                <li key={item}>{item}</li>
              )) : <li>No major loopholes detected.</li>}
            </ul>
          </div>
          <div>
            <strong>Illegal clause alerts</strong>
            <ul>
              {activeAnalysis.illegalClauseAlerts.length ? activeAnalysis.illegalClauseAlerts.map((item) => (
                <li key={item}>{item}</li>
              )) : <li>No explicit illegality signals detected.</li>}
            </ul>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Clause rulings snapshot</h2>
        <ul>
          {activeAnalysis.clauses.map((clause) => (
            <li key={clause.clauseId}>
              <strong>{clause.sectionReference}:</strong> {clause.courtroomAssessment.likelyRuling}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Evaluation and monitoring</h2>
        <ul>
          {Object.entries(activeAnalysis.evaluationMetrics).map(([key, value]) => (
            <li key={key}>
              <strong>{key}:</strong> {value}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};


export default ReportPage;
