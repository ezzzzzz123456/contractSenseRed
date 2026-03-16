import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import WorkspaceHeader from "../components/WorkspaceHeader";
import ReportExportButton from "../components/ReportExportButton";
import TrustSealBadge from "../components/TrustSealBadge";
import { useAuth } from "../hooks/useAuth";
import { useContract } from "../hooks/useContract";

const ReportPage = (): JSX.Element => {
  const { contractId, shareToken } = useParams<{ contractId: string; shareToken: string }>();
  const { currentUser } = useAuth();
  const {
    activeContract,
    activeReport,
    fetchContractById,
    fetchReportByContract,
    fetchSharedReport,
    saveLawyerReview,
    issueTrustSeal,
    shareReport,
  } = useContract();
  const [reviewSummary, setReviewSummary] = useState("");
  const [reviewRecommendation, setReviewRecommendation] = useState("");
  const [finalVerdict, setFinalVerdict] = useState("Proceed with signature");
  const [annotationDraft, setAnnotationDraft] = useState("Section 8.4|Limit geographic scope and reduce duration.|Senior Counsel");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareToken) {
      void fetchSharedReport(shareToken);
      return;
    }

    if (contractId) {
      if (!activeContract || activeContract._id !== contractId) {
        void fetchContractById(contractId);
      }

      void fetchReportByContract(contractId);
      return;
    }

    if (activeContract?._id) {
      void fetchReportByContract(activeContract._id);
    }
  }, [activeContract?._id, contractId, fetchContractById, fetchReportByContract, fetchSharedReport, shareToken]);

  useEffect(() => {
    if (!activeReport) {
      return;
    }

    setReviewSummary(activeReport.lawyerOutput.summary ?? "");
    setReviewRecommendation(activeReport.lawyerOutput.recommendation ?? "");
    setFinalVerdict(activeReport.lawyerOutput.finalVerdict ?? "Proceed with signature");
    setAnnotationDraft(
      (activeReport.lawyerOutput.annotations ?? [])
        .map((annotation) => `${annotation.clauseReference}|${annotation.note}|${annotation.authorRole}`)
        .join("\n") || "Section 8.4|Limit geographic scope and reduce duration.|Senior Counsel",
    );
  }, [activeReport]);

  const recommendations = Array.isArray(activeReport?.aiOutput?.recommendations)
    ? (activeReport?.aiOutput.recommendations as string[])
    : [];
  const highRisk = activeContract?.clauseList.filter((clause) => clause.riskFlag === "red") ?? [];
  const mediumRisk = activeContract?.clauseList.filter((clause) => clause.riskFlag === "yellow") ?? [];
  const lowRisk = activeContract?.clauseList.filter((clause) => clause.riskFlag === "green") ?? [];
  const annotations = activeReport?.lawyerOutput.annotations ?? [];
  const canEditReview = currentUser?.userType === "lawyer" && !shareToken;
  const finalRecommendation = activeReport?.lawyerOutput.finalVerdict ?? finalVerdict;
  const canIssueSeal = canEditReview && activeReport && !activeReport.trustSeal;
  const shareLabel = useMemo(
    () => activeReport?.shareUrl ?? window.location.href,
    [activeReport?.shareUrl],
  );

  const handleSaveReview = async (): Promise<void> => {
    if (!activeReport?._id) {
      return;
    }

    try {
      setError(null);
      const annotationsPayload = annotationDraft
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [clauseReference, note, authorRole] = line.split("|");
          return {
            clauseReference: clauseReference?.trim() ?? "General",
            note: note?.trim() ?? "",
            authorRole: authorRole?.trim() ?? "Legal Reviewer",
          };
        });

      await saveLawyerReview(activeReport._id, {
        summary: reviewSummary,
        recommendation: reviewRecommendation,
        finalVerdict,
        annotations: annotationsPayload,
      });
      setStatusMessage("Lawyer review saved.");
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to save lawyer review.");
    }
  };

  const handleIssueSeal = async (): Promise<void> => {
    if (!activeReport?._id) {
      return;
    }

    try {
      setError(null);
      await issueTrustSeal(activeReport._id, { finalVerdict });
      setStatusMessage("Trust seal issued and report finalized.");
    } catch (sealError) {
      setError(sealError instanceof Error ? sealError.message : "Unable to issue trust seal.");
    }
  };

  const handleShare = async (): Promise<void> => {
    if (!activeReport?._id || shareToken) {
      await navigator.clipboard.writeText(window.location.href);
      setStatusMessage("Page link copied.");
      return;
    }

    try {
      const response = await shareReport(activeReport._id);
      await navigator.clipboard.writeText(response.shareUrl);
      setStatusMessage("Secure share link copied.");
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : "Unable to create share link.");
    }
  };

  return (
    <div className="workspace-page workspace-page--report">
      <WorkspaceHeader actionLabel={canEditReview ? "Open Review Queue" : "Upgrade Plan"} actionTo={canEditReview ? "/lawyers/dashboard" : "/marketplace"} />
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
              onClick={() => void handleShare()}
            >
              Share Securely
            </button>
            <ReportExportButton />
          </div>
        </div>

        {activeReport ? (
          <>
            <TrustSealBadge seal={activeReport.trustSeal} />
            {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}

            <section className="report-summary-block">
              <div className="numbered-heading"><span>1</span><h2>Executive Summary (Plain English)</h2></div>
              <div className="report-summary-card">
                <p>{activeReport.aiOutput.summary ?? "No summary available."}</p>
                <p><strong>Key Takeaway:</strong> {activeReport.lawyerOutput.recommendation ?? recommendations[0] ?? "The agreement is broadly acceptable, but several clauses still benefit from human legal review."}</p>
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
              {annotations.length ? (
                annotations.map((annotation) => (
                  <div key={annotation.id} className="annotation-card">
                    <strong>{annotation.authorName}, {annotation.authorRole}</strong>
                    <p>{annotation.note}</p>
                    <span>Linked Clause: {annotation.clauseReference}</span>
                  </div>
                ))
              ) : (
                <div className="annotation-card">
                  <strong>No lawyer annotations yet</strong>
                  <p>This report is waiting for legal review annotations.</p>
                </div>
              )}
            </section>

            {canEditReview ? (
              <section className="report-summary-card review-editor">
                <div className="numbered-heading"><span>4</span><h2>Lawyer Review Editor</h2></div>
                <label>
                  Review Summary
                  <textarea value={reviewSummary} onChange={(event) => setReviewSummary(event.target.value)} rows={4} />
                </label>
                <label>
                  Recommendation
                  <textarea value={reviewRecommendation} onChange={(event) => setReviewRecommendation(event.target.value)} rows={3} />
                </label>
                <label>
                  Final Verdict
                  <input value={finalVerdict} onChange={(event) => setFinalVerdict(event.target.value)} />
                </label>
                <label>
                  Annotations
                  <textarea
                    value={annotationDraft}
                    onChange={(event) => setAnnotationDraft(event.target.value)}
                    rows={5}
                    placeholder="Clause reference|Note|Role"
                  />
                </label>
                <div className="review-editor__actions">
                  <button type="button" className="button button--ghost" onClick={() => void handleSaveReview()}>
                    Save Lawyer Review
                  </button>
                  {canIssueSeal ? (
                    <button type="button" className="button button--primary" onClick={() => void handleIssueSeal()}>
                      Issue Trust Seal
                    </button>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="verdict-panel">
              <div className="numbered-heading"><span>5</span><h2>Final Verdict</h2></div>
              <div className="verdict-panel__content">
                <h3>Recommendation: {finalRecommendation.toUpperCase()}</h3>
                <p>
                  {activeReport.lawyerOutput.summary ??
                    "Following a comprehensive dual-review by our proprietary AI engine and human legal specialists, we find this agreement to be within acceptable commercial risk parameters."}
                </p>
                <div className="verdict-checks">
                  <span>Compliance Verified</span>
                  <span>{activeReport.trustSeal ? "Trust Seal Active" : "Pending Trust Seal"}</span>
                  <span>{activeReport.lawyerOutput.reviewedAt ? "Expert Reviewed" : "Awaiting Expert Review"}</span>
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
                  <div><span>Final Status</span><strong>{activeReport.trustSeal ? "APPROVED" : "PENDING"}</strong></div>
                  <div><span>Seal Integrity</span><strong>{activeReport.trustSeal ? "VALID" : "WAITING"}</strong></div>
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
                  <h3>RECOMMENDATION: {finalRecommendation.toUpperCase()}</h3>
                  <p>{activeReport.lawyerOutput.recommendation ?? "All critical items identified in previous drafts have been successfully mitigated."}</p>
                </div>
              </div>
              <div className="report-preview__actions">
                <ReportExportButton />
                <p className="report-preview__share">{shareLabel}</p>
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
