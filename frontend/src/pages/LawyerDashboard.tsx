import WorkspaceHeader from "../components/WorkspaceHeader";

const LawyerDashboard = (): JSX.Element => (
  <div className="workspace-page">
    <WorkspaceHeader actionLabel="Open Review Queue" actionTo="/report" />
    <main className="report-layout">
      <section className="report-summary-card lift-card">
        <h1>Lawyer Dashboard</h1>
        <p>Assigned reviews, trust seal issuance, and expert annotations live here in the same premium ContractSense visual system.</p>
      </section>
    </main>
  </div>
);

export default LawyerDashboard;
