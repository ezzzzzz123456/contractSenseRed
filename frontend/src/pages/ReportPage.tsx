import { useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopbar from "../components/DashboardTopbar";
import { useContract } from "../hooks/useContract";

const ReportPage = (): JSX.Element => {
  const { activeContract, activeReport, fetchReportByContract } = useContract();

  useEffect(() => {
    if (activeContract?._id) {
      void fetchReportByContract(activeContract._id);
    }
  }, [activeContract?._id, fetchReportByContract]);

  const recommendations = Array.isArray(activeReport?.aiOutput?.recommendations)
    ? (activeReport.aiOutput.recommendations as string[])
    : [];

  const lawyerLink = activeContract?.contractType
    ? `/marketplace?contractType=${encodeURIComponent(activeContract.contractType)}`
    : "/marketplace";

  return (
    <div className="dashboard-layout dashboard-layout--light">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardTopbar title="Reports" subtitle="Review the contract summary first, then consult a lawyer only when needed." />
        <main className="dashboard-content dashboard-content--light page-fade-in">
          <section className="reports-overview lift-card">
            <div>
              <h2>{activeContract?.fileUrl.split("/").pop() ?? "No report selected"}</h2>
              <p>{activeReport?.aiOutput.summary ?? "Analyze a contract to generate its report."}</p>
            </div>
            <div className="reports-overview__metrics">
              <article>
                <span>Risk score</span>
                <strong>{activeReport?.aiOutput.overallRiskScore ?? 0}/100</strong>
              </article>
              <article>
                <span>Contract type</span>
                <strong>{activeContract?.contractType?.toUpperCase() ?? "N/A"}</strong>
              </article>
            </div>
          </section>

          <section className="reports-grid">
            <article className="reports-card lift-card">
              <h3>Executive summary</h3>
              <p>{activeReport?.aiOutput.summary ?? "No summary available yet."}</p>
            </article>

            <article className="reports-card lift-card">
              <h3>Recommendations</h3>
              {recommendations.length ? (
                <ul className="reports-list">
                  {recommendations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No recommendations available yet.</p>
              )}
            </article>

            <article className="reports-card reports-card--action lift-card">
              <h3>Need human review?</h3>
              <p>When you want a legal expert to check this report, open the filtered lawyer list for this contract type.</p>
              <Link to={lawyerLink} className="button button--primary">Consult Lawyer</Link>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ReportPage;
