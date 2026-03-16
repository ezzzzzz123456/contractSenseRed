import { useState } from "react";
import { useContract } from "../hooks/useContract";

const ReportExportButton = (): JSX.Element => {
  const { activeReport, exportReport } = useContract();
  const [status, setStatus] = useState<string | null>(null);

  const handleExport = async (): Promise<void> => {
    if (!activeReport?._id) {
      setStatus("Analyze a contract first.");
      return;
    }

    const data = await exportReport(activeReport._id);
    setStatus("PDF export prepared.");

    if (data.exportedPdfUrl) {
      window.open(data.exportedPdfUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="export-action">
      <button type="button" className="button button--secondary" onClick={() => void handleExport()}>
        Export PDF
      </button>
      {status ? <span>{status}</span> : null}
    </div>
  );
};

export default ReportExportButton;
