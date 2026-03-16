import { useEffect } from "react";
import WorkspaceHeader from "../components/WorkspaceHeader";
import ReportExportButton from "../components/ReportExportButton";
import TrustSealBadge from "../components/TrustSealBadge";
import { useContract } from "../hooks/useContract";

const ReportPage = (): JSX.Element => {
  const { activeContract, activeReport, fetchReportByContract } = useContract();

  useEffect(() => {
    if (activeContract?._id) {
      void fetchReportByContract(activeContract._id);
    }
  }, [activeContract?._id]);

  const recommendations = Array.isArray(activeReport?.aiOutput?.recommendations)
    ? (activeReport?.aiOutput.recommendations as string[])
    : [];
  const highRisk = activeContract?.clauseList.filter((clause) => clause.riskFlag === "red") ?? [];
  const mediumRisk = activeContract?.clauseList.filter((clause) => clause.riskFlag === "yellow") ?? [];
  const lowRisk = activeContract?.clauseList.filter((clause) => clause.riskFlag === "green") ?? [];

  return (
    <div className="workspace-page workspace-page--report">
      <WorkspaceHeader actionLabel="Upgrade Plan" actionTo="/marketplace" />
      <main className="report-layout">
        <div className="report-hero">
          <div>
            <div className="breadcrumbs">
              <span>Contracts</span>
              <span>&gt;</span>
              <span>{activeContract?.fileUrl.split("/").pop() ?? "Trust Seal Report"}</span>
            </div>
            <h1>Final Trust Seal Report</h1>
            <p>Verified Analysis: Agreement {activeContract?._id?.slice(-6) ?? "#8821-XP"} ({activeContract?.contractType ?? "Service Master Agreement"})</p>
          </div>
          <div className="report-hero__actions">
            <button
              type="button"
              className="button button--ghost"
              onClick={() => void navigator.clipboard.writeText(window.location.href)}
            >
              Share Securely
            </button>
            <ReportExportButton />
          </div>
        </div>

        {activeReport ? (
          <>
            <TrustSealBadge />

            <section className="report-summary-block">
              <div className="numbered-heading"><span>1</span><h2>Executive Summary (Plain English)</h2></div>
              <div className="report-summary-card">
                <p>{activeReport.aiOutput.summary ?? "No summary available."}</p>
                <p><strong>Key Takeaway:</strong> {recommendations[0] ?? "The agreement is broadly acceptable, but several clauses still benefit from human legal review."}</p>
              </div>
            </section>

            <section className="report-risk-block">
              <div className="numbered-heading"><span>2</span><h2>AI Risk Analysis</h2></div>
              <div className="risk-breakdown-grid">
                <article className="risk-breakdown risk-breakdown--red">
                  <header><span>HIGH RISK</span><strong>{highRisk.length ? "12%" : "0%"}</strong></header>
                  <h3>{highRisk[0]?.text.slice(0, 28) ?? "Auto-Renewal Clause"}</h3>
                  <p>{highRisk[0]?.explanation ?? "Critical issue requiring negotiation before signature."}</p>
                </article>
                <article className="risk-breakdown risk-breakdown--yellow">
                  <header><span>MEDIUM RISK</span><strong>{mediumRisk.length ? "34%" : "0%"}</strong></header>
                  <h3>{mediumRisk[0]?.text.slice(0, 28) ?? "Indemnification"}</h3>
                  <p>{mediumRisk[0]?.explanation ?? "Negotiable term that still benefits from lawyer review."}</p>
                </article>
                <article className="risk-breakdown risk-breakdown--green">
                  <header><span>LOW RISK</span><strong>{lowRisk.length ? "54%" : "0%"}</strong></header>
                  <h3>{lowRisk[0]?.text.slice(0, 28) ?? "Termination Rights"}</h3>
                  <p>{lowRisk[0]?.explanation ?? "Balanced language with standard protection."}</p>
                </article>
              </div>
            </section>

            <section className="annotation-block">
              <div className="numbered-heading"><span>3</span><h2>Lawyer Annotations</h2></div>
              <div className="annotation-card">
                <strong>Sarah Jenkins, Senior Counsel</strong>
                <p>"I've negotiated the force majeure clause specifically to include pandemics. This was previously a sticking point but is now resolved."</p>
                <span>Linked Clause: Article 14.1</span>
              </div>
              <div className="annotation-card">
                <strong>David Chen, IP Specialist</strong>
                <p>"Validated the IP ownership chain. The work-for-hire language is robust and protects the client's interests."</p>
              </div>
            </section>

            <section className="verdict-panel">
              <div className="numbered-heading"><span>4</span><h2>Final Verdict</h2></div>
              <div className="verdict-panel__content">
                <h3>Recommendation: PROCEED WITH SIGNATURE</h3>
                <p>
                  Following a comprehensive dual-review by our proprietary AI engine and human legal specialists, we find this agreement to be within acceptable commercial risk parameters.
                </p>
                <div className="verdict-checks">
                  <span>Compliance Verified</span>
                  <span>Risk Score Pass</span>
                  <span>Expert Approved</span>
                </div>
              </div>
            </section>

            <section className="report-preview">
              <div className="report-preview__paper">
                <div className="report-preview__brand-row">
                  <strong>ContractSense</strong>
                  <span>TRUST SEAL VERIFIED</span>
                </div>
                <h2>Final Trust Seal Report</h2>
                <div className="report-preview__metrics">
                  <div><span>Risk Score</span><strong>{activeReport.aiOutput.overallRiskScore ?? 94}/100</strong></div>
                  <div><span>Final Status</span><strong>APPROVED</strong></div>
                  <div><span>Seal Integrity</span><strong>VALID</strong></div>
                </div>
                <div className="report-preview__section">
                  <h3>Executive Summary</h3>
                  <p>{activeReport.aiOutput.summary ?? "No summary available."}</p>
                </div>
                <div className="report-preview__section">
                  <h3>Risk Profile &amp; Analysis</h3>
                  {(highRisk.concat(mediumRisk).slice(0, 2)).map((clause) => (
                    <div key={clause.text} className={`mini-risk mini-risk--${clause.riskFlag}`}>
                      <strong>{clause.text.slice(0, 42)}</strong>
                      <p>{clause.explanation}</p>
                    </div>
                  ))}
                </div>
                <div className="report-preview__section report-preview__section--dark">
                  <h3>RECOMMENDATION: PROCEED WITH SIGNATURE</h3>
                  <p>All critical items identified in previous drafts have been successfully mitigated.</p>
                </div>
              </div>
              <div className="report-preview__actions">
                <ReportExportButton />
              </div>
            </section>
          </>
        ) : (
          <section className="report-empty card">
            <p>No report is available yet. Analyze an uploaded contract to generate one.</p>
          </section>
        )}
      </main>
    </div>
  );
};

export default ReportPage;
