import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopbar from "../components/DashboardTopbar";
import type { Lawyer } from "../types";

const lawyers: Array<Lawyer & { headline: string }> = [
  {
    userId: "lawyer_1",
    specializations: ["msa", "vendor", "commercial contracts"],
    isVerified: true,
    ratings: 4.9,
    feePerReview: 299,
    headline: "Commercial contracts specialist",
  },
  {
    userId: "lawyer_2",
    specializations: ["nda", "employment", "privacy"],
    isVerified: true,
    ratings: 4.8,
    feePerReview: 249,
    headline: "Employment and NDA reviewer",
  },
  {
    userId: "lawyer_3",
    specializations: ["saas", "msa", "technology agreements"],
    isVerified: true,
    ratings: 4.95,
    feePerReview: 349,
    headline: "SaaS and technology agreement counsel",
  },
];

const MarketplacePage = (): JSX.Element => {
  const location = useLocation();
  const contractType = new URLSearchParams(location.search).get("contractType")?.toLowerCase() ?? "";

  const filteredLawyers = useMemo(() => {
    if (!contractType) {
      return lawyers;
    }

    return lawyers.filter((lawyer) => lawyer.specializations.some((item) => item.toLowerCase().includes(contractType)));
  }, [contractType]);

  return (
    <div className="dashboard-layout dashboard-layout--light">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardTopbar
          title="Consult Lawyer"
          subtitle={contractType ? `Showing lawyers best suited for ${contractType.toUpperCase()} contracts.` : "Showing available lawyers for contract review."}
        />
        <main className="dashboard-content dashboard-content--light page-fade-in">
          <section className="lawyer-marketplace">
            {filteredLawyers.length ? (
              filteredLawyers.map((lawyer) => (
                <article key={lawyer.userId} className="lawyer-marketplace__card lift-card">
                  <div>
                    <h3>{lawyer.headline}</h3>
                    <p>{lawyer.specializations.join(" • ")}</p>
                  </div>
                  <div className="lawyer-marketplace__meta">
                    <span>Rating {lawyer.ratings}</span>
                    <strong>${lawyer.feePerReview} / review</strong>
                  </div>
                  <Link to="/lawyers/dashboard" className="button button--primary">Request Review</Link>
                </article>
              ))
            ) : (
              <section className="reports-card lift-card">
                <h3>No direct lawyer match found</h3>
                <p>Try opening the marketplace without a contract filter or choose a different report.</p>
                <Link to="/report" className="button button--glass">Back to Reports</Link>
              </section>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default MarketplacePage;
