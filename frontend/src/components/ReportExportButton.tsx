import { useState } from "react";
import api from "../services/api";
import { useContract } from "../hooks/useContract";

const ReportExportButton = (): JSX.Element => {
  const { activeReport, setActiveReport } = useContract();
  const [status, setStatus] = useState<string | null>(null);

  const handleExport = async (): Promise<void> => {
    if (!activeReport?._id) {
      setStatus("Analyze a contract first.");
      return;
    }

    const { data } = await api.post<{ reportId: string; exportedPdfUrl: string; status: string }>(
      `/reports/${activeReport._id}/export`,
    );

    setActiveReport({
      ...activeReport,
      exportedPdfUrl: data.exportedPdfUrl,
    });
    setStatus("PDF export prepared.");
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
