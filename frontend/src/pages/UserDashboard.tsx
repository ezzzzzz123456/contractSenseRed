import { useEffect } from "react";
import { Link } from "react-router-dom";
import ContractUploader from "../components/ContractUploader";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopbar from "../components/DashboardTopbar";
import { useAuth } from "../hooks/useAuth";
import { useContract } from "../hooks/useContract";

const UserDashboard = (): JSX.Element => {
  const { currentUser } = useAuth();
  const { contracts, activeContract, setActiveContract, fetchContracts, isLoadingContracts } = useContract();

  useEffect(() => {
    if (currentUser) {
      void fetchContracts();
    }
  }, [currentUser, fetchContracts]);

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardTopbar title="Dashboard" />
        <main className="dashboard-content">
          <section className="dashboard-hero">
            <h2>Welcome back, {currentUser?.name?.split(" ")[0] ?? "Alex"}</h2>
            <p>Securely upload and analyze your legal documents with state-of-the-art AI.</p>
          </section>

          <ContractUploader />

          <section className="analysis-table-card">
            <div className="analysis-table-card__header">
              <h2>Recent Analyses</h2>
              <div>
                <button type="button" className="button button--ghost" onClick={() => void fetchContracts()} disabled={isLoadingContracts}>
                  {isLoadingContracts ? "Refreshing..." : "Refresh"}
                </button>
                <Link to="/analysis" className="link-action">View All</Link>
              </div>
            </div>

            {!currentUser ? <p>Please sign in to view uploaded contracts.</p> : null}
            {currentUser && contracts.length === 0 && !isLoadingContracts ? (
              <p>No contracts uploaded yet. Your first upload will appear here.</p>
            ) : null}

            {contracts.length ? (
              <div className="analysis-table">
                <div className="analysis-table__head">
                  <span>Document Name</span>
                  <span>Date Uploaded</span>
                  <span>Status</span>
                  <span>Risk Level</span>
                  <span>Actions</span>
                </div>
                {contracts.map((contract) => {
                  const risk =
                    contract.clauseList.some((clause) => clause.riskFlag === "red")
                      ? "High Risk"
                      : contract.clauseList.some((clause) => clause.riskFlag === "yellow")
                        ? "Medium Risk"
                        : contract.status === "analyzed" || contract.status === "reviewed"
                          ? "Low Risk"
                          : "Pending";

                  return (
                    <article
                      key={contract._id}
                      className={`analysis-row${activeContract?._id === contract._id ? " analysis-row--active" : ""}`}
                    >
                      <span>
                        <strong>{contract.fileUrl.split("/").pop()}</strong>
                        <small>{contract.contractType.toUpperCase()}</small>
                      </span>
                      <span>{contract._id?.slice(-6) ?? "Oct 24, 2023"}</span>
                      <span className={`status-badge status-badge--${contract.status}`}>{contract.status}</span>
                      <span className={`risk-text risk-text--${risk.toLowerCase().includes("high") ? "red" : risk.toLowerCase().includes("medium") ? "yellow" : "green"}`}>
                        {risk}
                      </span>
                      <span className="row-actions">
                        <button type="button" className="link-button" onClick={() => setActiveContract(contract)}>
                          Select
                        </button>
                        <Link to={`/analysis/${contract._id}`}>Analyze</Link>
                        <Link to={`/report/${contract._id}`}>Report</Link>
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
