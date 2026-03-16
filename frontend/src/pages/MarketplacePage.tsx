import WorkspaceHeader from "../components/WorkspaceHeader";
import LawyerCard from "../components/LawyerCard";
import type { Lawyer } from "../types";

const lawyer: Lawyer = {
  userId: "user_002",
  specializations: ["Commercial Contracts", "SaaS Agreements"],
  isVerified: true,
  ratings: 4.9,
  feePerReview: 299,
};

const MarketplacePage = (): JSX.Element => (
  <div className="workspace-page">
    <WorkspaceHeader actionLabel="Request Lawyer Review" actionTo="/lawyers/dashboard" />
    <main className="report-layout">
      <div className="section-heading section-heading--left">
        <h2>Lawyer Marketplace</h2>
        <p>Connect with verified legal professionals for human review, trust seal verification, and negotiation support.</p>
      </div>
      <div className="portal-grid">
        <LawyerCard lawyer={lawyer} />
      </div>
    </main>
  </div>
);

export default MarketplacePage;
