import { useReport } from "../hooks/useReport";


const ReportExportButton = (): JSX.Element => {
  const { activeAnalysis } = useReport();

  const handleExport = () => {
    if (!activeAnalysis) {
      return;
    }
    const blob = new Blob([JSON.stringify(activeAnalysis, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeAnalysis.contractId}-report.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="secondary-button" type="button" onClick={handleExport} disabled={!activeAnalysis}>
      Export report JSON
    </button>
  );
};


export default ReportExportButton;
