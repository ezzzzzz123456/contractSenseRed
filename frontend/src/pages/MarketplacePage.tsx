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
  <main className="page-shell grid">
    <h1>Lawyer Marketplace</h1>
    <LawyerCard lawyer={lawyer} />
  </main>
);

export default MarketplacePage;

