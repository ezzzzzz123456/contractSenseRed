import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useContract } from "../hooks/useContract";

const ContractUploader = (): JSX.Element => {
  const { uploadContract } = useContract();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      const contract = await uploadContract({ file: selectedFile, contractType: "auto" });
      setStatusMessage(`Uploaded ${selectedFile.name}. AI will detect the contract type automatically.`);
      setSelectedFile(null);
      event.currentTarget.reset();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload contract.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="upload-panel lift-card">
      <div className="upload-panel__badge">U</div>
      <h2>Upload new contract</h2>
      <p>Drag and drop your PDF file here or click to start analysis. ContractSense will identify the contract type automatically.</p>

      <form onSubmit={(event) => void handleSubmit(event)} className="upload-panel__form">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="visually-hidden"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />

        <div className="upload-panel__actions">
          <button type="button" className="button button--primary upload-select" onClick={() => fileInputRef.current?.click()}>
            Upload Contract
          </button>
          <button type="submit" className="button button--glass" disabled={submitting || !selectedFile}>
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
