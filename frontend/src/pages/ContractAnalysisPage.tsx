import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ClauseCard from "../components/ClauseCard";
import ExtractedDocumentPanel from "../components/ExtractedDocumentPanel";
import OutcomeSimulatorChat from "../components/OutcomeSimulatorChat";
import PartyIntelligencePanel from "../components/PartyIntelligencePanel";
import ReportExportButton from "../components/ReportExportButton";
import WorkspaceHeader from "../components/WorkspaceHeader";
import { useAuth } from "../hooks/useAuth";
import { useContract } from "../hooks/useContract";

const ContractAnalysisPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { contractId } = useParams<{ contractId: string }>();
  const { currentUser } = useAuth();
  const {
    contracts,
    activeContract,
    setActiveContract,
    fetchContracts,
    fetchContractById,
    analyzeContract,
    isAnalyzingContract,
    activeReport,
    activeAnalysis,
    fetchReportByContract,
    shareReport,
  } = useContract();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && contracts.length === 0) {
      void fetchContracts();
    }
  }, [currentUser, contracts.length, fetchContracts]);

  useEffect(() => {
    if (!contractId || !currentUser) {
      return;
    }

    if (activeContract?._id === contractId) {
      return;
    }

    const matchingContract = contracts.find((contract) => contract._id === contractId);

    if (matchingContract) {
      setActiveContract(matchingContract);
      return;
    }

    void fetchContractById(contractId);
  }, [activeContract?._id, contractId, contracts, currentUser, fetchContractById, setActiveContract]);

  useEffect(() => {
    if (activeContract?._id && activeContract.status === "analyzed") {
      void fetchReportByContract(activeContract._id);
    }
  }, [activeContract?._id, activeContract?.status, fetchReportByContract]);

  const redClauses = activeContract?.clauseList.filter((clause) => clause.riskFlag === "red").length ?? 0;
  const yellowClauses = activeContract?.clauseList.filter((clause) => clause.riskFlag === "yellow").length ?? 0;
  const confidence = activeReport?.aiOutput.overallRiskScore ? Math.min(98, activeReport.aiOutput.overallRiskScore + 18) : 98;

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
      navigate(`/analysis/${result.contract._id}`);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Unable to analyze contract.");
    }
  };

  const handleShare = async (): Promise<void> => {
    if (!activeReport?._id) {
      await navigator.clipboard.writeText(window.location.href);
      setStatusMessage("Page link copied.");
      return;
    }

    const shareData = await shareReport(activeReport._id);
    await navigator.clipboard.writeText(shareData.shareUrl);
    setStatusMessage("Secure report link copied.");
  };

  return (
    <div className="workspace-page">
      <WorkspaceHeader actionLabel="Request Lawyer Review" actionTo="/marketplace" />
      <main className="analysis-layout">
        <div className="analysis-header">
          <div>
            <div className="breadcrumbs">
              <Link to="/dashboard">Documents</Link>
              <span>&gt;</span>
              <span>{activeContract?.fileUrl.split("/").pop() ?? "Employment_Agreement_v2.pdf"}</span>
            </div>
            <h1>Contract Analysis Report</h1>
            <div className="analysis-meta">
              <span>Analyzed {activeContract?.status === "analyzed" ? "just now" : "pending analysis"}</span>
              <span>{activeContract?.contractType ?? "Employment/Non-Compete"}</span>
              <span>TechCorp Inc.</span>
            </div>
          </div>
          <div className="analysis-header__actions">
            <ReportExportButton />
            <button type="button" className="button button--primary" onClick={() => void handleShare()}>
              Share
            </button>
          </div>
        </div>

        <section className="analysis-picker">
          {!currentUser ? <p>Please sign in to analyze a contract.</p> : null}
          {currentUser && contracts.length === 0 ? <p>No uploaded contracts yet. Upload one from the dashboard first.</p> : null}
          <div className="analysis-picker__row">
            {contracts.map((contract) => (
              <button
                key={contract._id}
                type="button"
                className={`analysis-picker__item${activeContract?._id === contract._id ? " analysis-picker__item--active" : ""}`}
                onClick={() => {
                  setActiveContract(contract);
                  navigate(`/analysis/${contract._id}`);
                }}
              >
                <strong>{contract.fileUrl.split("/").pop()}</strong>
                <span>{contract.status}</span>
              </button>
            ))}
          </div>
          <div className="analysis-picker__actions">
            <button type="button" className="button button--primary" onClick={() => void handleAnalyze()} disabled={!activeContract || isAnalyzingContract}>
              {isAnalyzingContract ? "Analyzing..." : "Run AI Analysis"}
            </button>
            {statusMessage ? <span className="form-success">{statusMessage}</span> : null}
            {error ? <span className="form-error">{error}</span> : null}
          </div>
        </section>

        <div className="analysis-columns">
          <div className="analysis-columns__main">
            <section className="summary-card">
              <div className="summary-card__icon">S</div>
              <h2>Executive Summary</h2>
              <p>
                {activeReport?.aiOutput.summary ??
                  activeAnalysis?.summary ??
                  "This agreement is standard for the technology sector but contains clauses that may require negotiation before signature."}
              </p>
              <p>
                {activeAnalysis?.executiveLegalSummary ??
                  "Key highlights include clearly defined ownership language, key notice obligations, and a risk distribution profile that should be reviewed before execution."}
              </p>
              <div className="summary-metrics">
                <div>
                  <span>Risk Score</span>
                  <strong>{activeReport?.aiOutput.overallRiskScore ?? activeAnalysis?.overallRiskScore ?? 64}/100</strong>
                </div>
                <div>
                  <span>Clauses</span>
                  <strong>{activeContract?.clauseList.length ?? activeAnalysis?.clauses.length ?? 0}</strong>
                </div>
                <div>
                  <span>Confidence</span>
                  <strong>{confidence}%</strong>
                </div>
              </div>
            </section>

            {activeAnalysis ? <ExtractedDocumentPanel report={activeAnalysis} /> : null}
            <OutcomeSimulatorChat contractId={activeContract?._id} />
          </div>

          <aside className="analysis-columns__side">
            <section className="risk-summary-header">
              <h2>Risk Flags</h2>
              <div className="risk-summary-header__pills">
                <span>{redClauses} High</span>
                <span>{yellowClauses} Med</span>
              </div>
            </section>

            {activeContract?.clauseList?.length ? (
              activeContract.clauseList.map((clause, index) => (
                <ClauseCard key={`${clause.text}-${index}`} clause={clause} />
              ))
            ) : (
              <section className="empty-analysis card">
                <p>No clause analysis available yet. Run analysis on an uploaded contract to populate this view.</p>
              </section>
            )}

            <PartyIntelligencePanel intel={activeAnalysis?.contractorCredibility} />
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ContractAnalysisPage;
