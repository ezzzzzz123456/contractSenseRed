import { useEffect, useMemo, useState } from "react";
import WorkspaceHeader from "../components/WorkspaceHeader";
import LawyerCard from "../components/LawyerCard";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useContract } from "../hooks/useContract";
import type { Contract, Lawyer, LawyerReviewRequestResponse } from "../types";

const MarketplacePage = (): JSX.Element => {
  const { currentUser } = useAuth();
  const { contracts, activeContract, setActiveContract, fetchContracts } = useContract();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [requestNote, setRequestNote] = useState("Please review the highlighted termination and payment clauses before signature.");
  const [selectedLawyerId, setSelectedLawyerId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    const loadLawyers = async (): Promise<void> => {
      const { data } = await api.get<Lawyer[]>("/lawyers");
      setLawyers(data);
    };

    void loadLawyers();
  }, []);

  const selectableContracts = useMemo(
    () => contracts.filter((contract) => contract.status === "analyzed" || contract.status === "pending_lawyer" || contract.status === "reviewed"),
    [contracts],
  );

  const handleRequestReview = async (lawyer: Lawyer): Promise<void> => {
    if (!activeContract?._id) {
      setError("Select an analyzed contract before requesting lawyer review.");
      return;
    }

    if (!lawyer._id) {
      setError("Selected lawyer is missing an id.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post<LawyerReviewRequestResponse>("/lawyers/request-review", {
        contractId: activeContract._id,
        lawyerId: lawyer._id,
        note: requestNote,
      });

      setSelectedLawyerId(lawyer._id);
      setStatusMessage(`Review requested from ${data.lawyer.name ?? "assigned counsel"} for ${activeContract.contractType.toUpperCase()}.`);
      await fetchContracts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to request lawyer review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="workspace-page">
      <WorkspaceHeader actionLabel={currentUser?.userType === "lawyer" ? "Open Review Queue" : "Request Lawyer Review"} actionTo="/lawyers/dashboard" />
      <main className="report-layout">
        <div className="section-heading section-heading--left">
          <h2>Lawyer Marketplace</h2>
          <p>Connect with verified legal professionals for human review, trust seal verification, and negotiation support.</p>
        </div>

        <section className="report-summary-card review-editor">
          <h3>Select Contract for Review</h3>
          <label>
            Contract
            <select
              value={activeContract?._id ?? ""}
              onChange={(event) => {
                const selected = contracts.find((contract) => contract._id === event.target.value) ?? null;
                setActiveContract(selected);
              }}
            >
              <option value="">Choose a contract</option>
              {selectableContracts.map((contract: Contract) => (
                <option key={contract._id} value={contract._id}>
                  {(contract.fileUrl.split("/").pop() ?? contract.contractType)} - {contract.status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Review Note
            <textarea value={requestNote} onChange={(event) => setRequestNote(event.target.value)} rows={3} />
          </label>
          {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </section>

        <div className="portal-grid">
          {lawyers.map((lawyer) => (
            <LawyerCard
              key={lawyer._id ?? lawyer.userId}
              lawyer={lawyer}
              actionLabel={
                submitting && selectedLawyerId === lawyer._id
                  ? "Requesting..."
                  : selectedLawyerId === lawyer._id
                    ? "Requested"
                    : "Request Review"
              }
              onAction={(selectedLawyer) => void handleRequestReview(selectedLawyer)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default MarketplacePage;
