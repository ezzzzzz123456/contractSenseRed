import ReportExportButton from "../components/ReportExportButton";
import TrustSealBadge from "../components/TrustSealBadge";

const ReportPage = (): JSX.Element => (
  <main className="page-shell grid">
    <h1>Report</h1>
    <section className="card">
      <p>TODO: render AI output, lawyer notes, and export metadata.</p>
      <ReportExportButton />
    </section>
    <TrustSealBadge />
  </main>
);

export default ReportPage;

