import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useContract } from "../hooks/useContract";
import { uploadContractForAnalysis } from "../services/api";
import type { Contract, NegotiationTone, Report } from "../types";


const toneOptions: NegotiationTone[] = ["gentle", "professional", "assertive", "aggressive", "legal formal"];

const toBase64 = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });


const ContractUploader = (): JSX.Element => {
  const navigate = useNavigate();
  const { setActiveAnalysis, setActiveContract, setActiveReport } = useContract();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [counterparty, setCounterparty] = useState("");
  const [tone, setTone] = useState<NegotiationTone>("professional");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Choose a contract file before analyzing.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const documentBase64 = await toBase64(selectedFile);
      const report = await uploadContractForAnalysis({
        fileName: selectedFile.name,
        mediaType: selectedFile.type || "application/octet-stream",
        documentBase64,
        parties: counterparty.trim() ? [counterparty.trim()] : [],
        requestedTone: tone,
      });

      const mappedContract: Contract = {
        _id: report.contractId,
        uploadedBy: "local-user",
        fileUrl: selectedFile.name,
        contractType: report.contractType.category,
        status: "analyzed",
        clauseList: report.clauses.map((clause) => ({
          clauseId: clause.clauseId,
          sectionReference: clause.sectionReference,
          title: clause.title,
          text: clause.originalText,
          simplifiedText: clause.plainLanguage,
          riskFlag: clause.colorIndicator,
          explanation: clause.explanation,
          counterClauseSuggestion: clause.improvement.revisedClause,
          riskScore: clause.riskScore,
          riskCategory: clause.riskCategory,
          recommendations: clause.recommendations,
          loopholes: clause.loopholes,
          legalScenarios: clause.legalScenarios,
          courtroomAssessment: clause.courtroomAssessment,
          negotiationDraft: clause.negotiation.draftedResponse,
          improvementJustification: clause.improvement.justification,
        })),
      };
      const mappedReport: Report = {
        contractId: report.contractId,
        aiOutput: report,
        lawyerOutput: {},
      };

      setActiveAnalysis(report);
      setActiveContract(mappedContract);
      setActiveReport(mappedReport);
      navigate("/analysis");
    } catch (submissionError) {
      setError("Analysis failed. Confirm the backend and AI service are running, then try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card uploader-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Contract Intelligence</p>
          <h2>Upload a contract for deep review</h2>
        </div>
        <span className="badge">PDF DOCX TXT JPG PNG</span>
      </div>
      <form className="uploader-form" onSubmit={handleSubmit}>
        <label className="input-group">
          <span>Contract file</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label className="input-group">
          <span>Counterparty name</span>
          <input
            type="text"
            placeholder="Optional: supplier, employer, landlord, investor..."
            value={counterparty}
            onChange={(event) => setCounterparty(event.target.value)}
          />
        </label>
        <label className="input-group">
          <span>Negotiation tone</span>
          <select value={tone} onChange={(event) => setTone(event.target.value as NegotiationTone)}>
            {toneOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Analyzing contract..." : "Generate intelligence report"}
        </button>
        {selectedFile ? <p className="helper-text">Selected file: {selectedFile.name}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </section>
  );
};


export default ContractUploader;
