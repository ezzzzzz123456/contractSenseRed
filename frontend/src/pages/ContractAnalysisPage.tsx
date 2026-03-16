import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopbar from "../components/DashboardTopbar";
import { useAuth } from "../hooks/useAuth";
import { useContract } from "../hooks/useContract";

const ContractAnalysisPage = (): JSX.Element => {
  const { currentUser } = useAuth();
  const {
    contracts,
    activeContract,
    setActiveContract,
    fetchContracts,
    analyzeContract,
    isAnalyzingContract,
    activeReport,
    fetchReportByContract,
  } = useContract();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openClauseIndex, setOpenClauseIndex] = useState<number>(0);
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    if (currentUser && contracts.length === 0) {
      void fetchContracts();
    }
  }, [currentUser, contracts.length, fetchContracts]);

  useEffect(() => {
    if (activeContract?._id && activeContract.status === "analyzed") {
      void fetchReportByContract(activeContract._id);
    }
  }, [activeContract?._id, activeContract?.status, fetchReportByContract]);

  const handleAnalyze = async (): Promise<void> => {
    if (!activeContract?._id) {
      setError("Select an uploaded contract before starting analysis.");
      return;
    }

    setError(null);
    setStatusMessage(null);

    try {
      const result = await analyzeContract(activeContract._id);
      setStatusMessage(`Analysis completed for ${result.contract.contractType.toUpperCase()} contract.`);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Unable to analyze contract.");
    }
  };

  const clauses = activeContract?.clauseList ?? [];
  const summary = activeReport?.aiOutput.summary ?? "Run analysis to generate a contract summary and detailed risk breakdown.";

  return (
    <div className="dashboard-layout dashboard-layout--light">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardTopbar title="My Contracts" subtitle="Review contract outputs in a simpler, more readable workspace." />
        <main className="dashboard-content dashboard-content--light page-fade-in">
          <section className="contracts-toolbar lift-card">
            <div>
              <h2>{activeContract?.fileUrl.split("/").pop() ?? "Select a contract"}</h2>
              <p>{summary}</p>
            </div>
            <div className="contracts-toolbar__actions">
              <button type="button" className="button button--primary" onClick={() => void handleAnalyze()} disabled={!activeContract || isAnalyzingContract}>
                {isAnalyzingContract ? "Analyzing..." : "Run Analysis"}
              </button>
              <Link to="/report" className="button button--glass">Open Report</Link>
            </div>
          </section>

          <section className="contracts-main-grid">
            <aside className="contracts-main-grid__side">
              <section className="contracts-list-card lift-card">
                <h3>Your contracts</h3>
                <div className="contracts-list">
                  {contracts.map((contract) => (
                    <button
                      key={contract._id}
                      type="button"
                      className={`contracts-list__item${activeContract?._id === contract._id ? " contracts-list__item--active" : ""}`}
                      onClick={() => setActiveContract(contract)}
                    >
                      <strong>{contract.fileUrl.split("/").pop()}</strong>
                      <span>{contract.contractType.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </section>
            </aside>

            <div className={`contracts-main-grid__content${assistantOpen ? " contracts-main-grid__content--split" : ""}`}>
              <div className="contracts-output">
                <section className="contracts-summary-card lift-card">
                  <div className="contracts-summary-card__stats">
                    <article>
                      <span>Risk score</span>
                      <strong>{activeReport?.aiOutput.overallRiskScore ?? 0}/100</strong>
                    </article>
                    <article>
                      <span>Clauses found</span>
                      <strong>{clauses.length}</strong>
                    </article>
                    <article>
                      <span>Status</span>
                      <strong>{activeContract?.status ?? "draft"}</strong>
                    </article>
                  </div>
                  {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
                  {error ? <p className="form-error">{error}</p> : null}
                </section>

                <section className="contracts-clauses">
                  <div className="contracts-section-heading">
                    <h3>Clause details</h3>
                    <p>Open each section only when you want more detail.</p>
                  </div>

                  {clauses.length ? (
                    clauses.map((clause, index) => {
                      const isOpen = openClauseIndex === index;

                      return (
                        <article key={`${clause.text}-${index}`} className={`contracts-accordion contracts-accordion--${clause.riskFlag} lift-card`}>
                          <button
                            type="button"
                            className="contracts-accordion__toggle"
                            onClick={() => setOpenClauseIndex(isOpen ? -1 : index)}
                          >
                            <div>
                              <strong>{clause.text.slice(0, 56)}{clause.text.length > 56 ? "..." : ""}</strong>
                              <span>{clause.explanation}</span>
                            </div>
                            <span className={`contracts-accordion__badge contracts-accordion__badge--${clause.riskFlag}`}>
                              {clause.riskFlag.toUpperCase()}
                            </span>
                          </button>
                          {isOpen ? (
                            <div className="contracts-accordion__body">
                              <section>
                                <h4>Simplified explanation</h4>
                                <p>{clause.simplifiedText}</p>
                              </section>
                              <section>
                                <h4>Suggested revision</h4>
                                <p>{clause.counterClauseSuggestion}</p>
                              </section>
                            </div>
                          ) : null}
                        </article>
                      );
                    })
                  ) : (
                    <section className="contracts-empty lift-card">
                      <p>No analysis details available yet. Upload and analyze a contract to populate this section.</p>
                    </section>
                  )}
                </section>
              </div>

              <aside className={`contracts-assistant${assistantOpen ? " contracts-assistant--open" : ""}`}>
                <button type="button" className="contracts-assistant__toggle button button--glass" onClick={() => setAssistantOpen((value) => !value)}>
                  {assistantOpen ? "Minimize AI Query" : "Ask AI Query"}
                </button>
                {assistantOpen ? (
                  <div className="contracts-assistant__panel lift-card">
                    <h3>Ask a contract question</h3>
                    <p>Use this when you want detailed scenario help without leaving the report.</p>
                    <textarea placeholder="What happens if payment is 45 days late?" rows={8} />
                    <button type="button" className="button button--primary">Send Query</button>
                  </div>
                ) : null}
              </aside>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ContractAnalysisPage;
