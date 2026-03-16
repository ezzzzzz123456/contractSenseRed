import ContractUploader from "../components/ContractUploader";

const UserDashboard = (): JSX.Element => (
  <main className="page-shell grid">
    <section className="hero-card card">
      <p className="eyebrow">Workspace</p>
      <h1>User Dashboard</h1>
      <p>Upload contracts, run AI risk analysis, and move directly into the negotiation and report views.</p>
    </section>
    <ContractUploader />
  </main>
);

export default UserDashboard;

