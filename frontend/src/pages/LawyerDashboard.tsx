import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WorkspaceHeader from "../components/WorkspaceHeader";
import api from "../services/api";
import type { AssignedReviewListResponse } from "../types";

const LawyerDashboard = (): JSX.Element => {
  const [reviews, setReviews] = useState<AssignedReviewListResponse["reviews"]>([]);

  useEffect(() => {
    const loadReviews = async (): Promise<void> => {
      const { data } = await api.get<AssignedReviewListResponse>("/lawyers/assigned/reviews");
      setReviews(data.reviews);
    };

    void loadReviews();
  }, []);

  return (
    <div className="workspace-page">
      <WorkspaceHeader actionLabel="Open Marketplace" actionTo="/marketplace" />
      <main className="report-layout">
        <section className="report-summary-card">
          <h1>Lawyer Dashboard</h1>
          <p>Assigned review requests now appear here with direct links into the report workspace.</p>
        </section>

        <section className="analysis-table-card">
          <div className="analysis-table-card__header">
            <h2>Assigned Reviews</h2>
          </div>

          {reviews.length ? (
            <div className="analysis-table">
              <div className="analysis-table__head">
                <span>Document</span>
                <span>Requested</span>
                <span>Status</span>
                <span>Risk Score</span>
                <span>Actions</span>
              </div>
              {reviews.map((review) => (
                <article key={review.reportId} className="analysis-row">
                  <span>
                    <strong>{review.contractName}</strong>
                    <small>{review.contractType.toUpperCase()}</small>
                  </span>
                  <span>{review.requestedAt ? new Date(review.requestedAt).toLocaleDateString() : "Pending"}</span>
                  <span className="status-badge status-badge--pending_lawyer">{review.reviewStatus}</span>
                  <span>{review.overallRiskScore ?? "N/A"}</span>
                  <span className="row-actions">
                    <Link to={`/report/${review.contractId}`}>Open Report</Link>
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p>No assigned reviews yet. Marketplace review requests will appear here.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default LawyerDashboard;
