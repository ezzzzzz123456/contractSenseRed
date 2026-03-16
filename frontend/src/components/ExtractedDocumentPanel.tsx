import type { ContractAnalysisReport } from "../types";


const ExtractedDocumentPanel = ({ report }: { report: ContractAnalysisReport }): JSX.Element => {
  const structured = report.documentStructure;
  const rawText = structured?.rawText || report.extraction.textPreview || "";
  const previewElements = structured?.pages.flatMap((page) => page.elements).slice(0, 12) ?? [];

  return (
    <section className="card">
      <h2>Extracted content</h2>
      <p>
        This is the actual content the system read from the file before legal analysis. The pipeline uses a
        Lens-style hybrid read flow: visual layout detection, text extraction, and multimodal document reasoning.
      </p>

      <div className="metric-grid">
        <div className="metric-card">
          <span>Pages</span>
          <strong>{report.extraction.structuredPages || structured?.pages.length || 0}</strong>
        </div>
        <div className="metric-card">
          <span>Layout elements</span>
          <strong>{report.extraction.layoutElements || previewElements.length}</strong>
        </div>
        <div className="metric-card">
          <span>Tables</span>
          <strong>{report.extraction.tablesDetected}</strong>
        </div>
        <div className="metric-card">
          <span>Structure confidence</span>
          <strong>{Math.round(report.extraction.structureConfidence * 100)}%</strong>
        </div>
      </div>

      {structured?.hierarchy?.length ? (
        <div>
          <h3>Detected hierarchy</h3>
          <ul>
            {structured.hierarchy.slice(0, 12).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {previewElements.length ? (
        <div>
          <h3>Detected layout blocks</h3>
          <ul>
            {previewElements.map((element) => (
              <li key={element.elementId}>
                <strong>{element.type}</strong> on page {element.pageNumber}: {element.text.slice(0, 160)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3>Actual extracted text</h3>
        <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>{rawText || "No extracted text available."}</pre>
      </div>

      {report.ingestionEvaluation ? (
        <div>
          <h3>Ingestion evaluation</h3>
          <ul>
            <li>Document structure accuracy: {Math.round(report.ingestionEvaluation.documentStructureAccuracy * 100)}%</li>
            <li>Clause detection accuracy: {Math.round(report.ingestionEvaluation.clauseDetectionAccuracy * 100)}%</li>
            <li>Table extraction accuracy: {Math.round(report.ingestionEvaluation.tableExtractionAccuracy * 100)}%</li>
            <li>Layout precision: {Math.round(report.ingestionEvaluation.layoutDetectionPrecision * 100)}%</li>
            <li>Latency: {Math.round(report.ingestionEvaluation.processingLatencyMs)} ms</li>
          </ul>
        </div>
      ) : null}
    </section>
  );
};


export default ExtractedDocumentPanel;
