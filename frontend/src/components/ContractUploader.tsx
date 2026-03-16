import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useContract } from "../hooks/useContract";

const ContractUploader = (): JSX.Element => {
  const { uploadContract } = useContract();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState("msa");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please choose a file before uploading.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setStatusMessage(null);

    try {
      const contract = await uploadContract({ file: selectedFile, contractType });
      setStatusMessage(`Uploaded ${selectedFile.name} as a ${contract.contractType} contract.`);
      setSelectedFile(null);
      event.currentTarget.reset();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload contract.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="upload-panel">
      <div className="upload-panel__badge">U</div>
      <h2>Upload Contract</h2>
      <p>Drag and drop your PDF, DOCX, or scan here to begin AI intelligence extraction.</p>

      <form onSubmit={(event) => void handleSubmit(event)} className="upload-panel__form">
        <div className="upload-type-row">
          {[
            { value: "msa", label: "MSA" },
            { value: "nda", label: "NDA" },
            { value: "employment", label: "Employment" },
            { value: "vendor", label: "Vendor" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={`upload-chip${contractType === option.value ? " upload-chip--active" : ""}`}
              onClick={() => setContractType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          className="visually-hidden"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />

        <div className="upload-panel__actions">
          <button type="button" className="button button--primary upload-select" onClick={() => fileInputRef.current?.click()}>
            + Select Files
          </button>
          <button type="submit" className="button button--ghost" disabled={submitting || !selectedFile}>
            {submitting ? "Uploading..." : "Upload Now"}
          </button>
        </div>

        <p className="upload-panel__hint">
          {selectedFile ? `Ready to upload: ${selectedFile.name}` : "SUPPORTS UP TO 50MB"}
        </p>
        {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </section>
  );
};

export default ContractUploader;
