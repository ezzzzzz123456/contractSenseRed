import { useEffect } from "react";
import { Link } from "react-router-dom";
import ContractUploader from "../components/ContractUploader";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopbar from "../components/DashboardTopbar";
import { useAuth } from "../hooks/useAuth";
import { useContract } from "../hooks/useContract";

const metrics = [
  { label: "Files analyzed", value: "128", tone: "blue", icon: "F" },
  { label: "Lawyer reviews", value: "5", tone: "orange", icon: "L" },
  { label: "Risk flags found", value: "12", tone: "red", icon: "!" },
];

const UserDashboard = (): JSX.Element => {
  const { currentUser } = useAuth();
  const { contracts, activeContract, setActiveContract, fetchContracts, isLoadingContracts } = useContract();

  useEffect(() => {
    if (currentUser) {
      void fetchContracts();
    }
  }, [currentUser, fetchContracts]);

  return (
    <div className="dashboard-layout dashboard-layout--light">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardTopbar title={`Welcome back, ${currentUser?.name?.split(" ")[0] ?? "Alex"}!`} subtitle="Here's what is happening with your legal documents today." />
        <main className="dashboard-content dashboard-content--light page-fade-in">
          <section className="dashboard-stats">
            {metrics.map((metric, index) => (
              <article key={metric.label} className={`dashboard-stat-card dashboard-stat-card--${metric.tone} lift-card`} style={{ animationDelay: `${index * 80}ms` }}>
                <div className="dashboard-stat-card__icon">{metric.icon}</div>
                <div>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              </article>
            ))}
          </section>

          <section className="dashboard-main-grid">
            <div className="dashboard-main-grid__primary">
              <ContractUploader />

              <section className="analysis-table-card analysis-table-card--dashboard lift-card">
                <div className="analysis-table-card__header">
                  <h2>Recent analyses</h2>
                  <div>
                    <button
                      type="button"
                      className="button button--glass"
                      onClick={() => void fetchContracts()}
                      disabled={isLoadingContracts}
                    >
                      {isLoadingContracts ? "Refreshing..." : "Refresh"}
                    </button>
                    <Link to="/report" className="link-action">Open Reports</Link>
                  </div>
                </div>

                {contracts.length ? (
                  <div className="analysis-table">
                    <div className="analysis-table__head">
                      <span>Contract Name</span>
                      <span>Status</span>
                      <span>Type</span>
                      <span>Risk Level</span>
                      <span>Actions</span>
                    </div>
                    {contracts.slice(0, 5).map((contract) => {
                      const risk =
                        contract.clauseList.some((clause) => clause.riskFlag === "red")
                          ? "High Risk"
                          : contract.clauseList.some((clause) => clause.riskFlag === "yellow")
                            ? "Medium Risk"
                            : contract.status === "analyzed"
                              ? "Low Risk"
                              : "Pending";

                      return (
                        <article
                          key={contract._id}
                          className={`analysis-row${activeContract?._id === contract._id ? " analysis-row--active" : ""}`}
                        >
                          <span>
                            <strong>{contract.fileUrl.split("/").pop()}</strong>
                          </span>
                          <span className={`status-badge status-badge--${contract.status}`}>{contract.status}</span>
                          <span>{contract.contractType.toUpperCase()}</span>
                          <span className={`risk-text risk-text--${risk.toLowerCase().includes("high") ? "red" : risk.toLowerCase().includes("medium") ? "yellow" : "green"}`}>
                            {risk}
                          </span>
                          <span className="row-actions">
                            <button type="button" className="link-button" onClick={() => setActiveContract(contract)}>Select</button>
                            <Link to="/report">View Report</Link>
                          </span>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p>No contracts uploaded yet. Your first uploaded contract will appear here.</p>
                )}
              </section>
            </div>

            <aside className="dashboard-main-grid__side">
              <section className="dashboard-note-card lift-card">
                <h3>What happens next?</h3>
                <ul className="insight-panel__list">
                  <li>Upload a contract and let AI detect its type automatically.</li>
                  <li>Open Reports to see the summary and risk output.</li>
                  <li>Consult a lawyer from a report when human review is needed.</li>
                </ul>
              </section>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
