import { createContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import api, { fetchStoredContractReport } from "../services/api";
import type {
  Contract,
  ContractAnalysisReport,
  ContractAnalysisTriggerResponse,
  ContractListResponse,
  ContractResponse,
  ContractUploadResponse,
  ExportReportResponse,
  LawyerReviewPayload,
  LawyerReviewResponse,
  Report,
  ShareReportResponse,
} from "../types";

interface ContractContextValue {
  contracts: Contract[];
  activeContract: Contract | null;
  activeReport: Report | null;
  activeAnalysis: ContractAnalysisReport | null;
  isLoadingContracts: boolean;
  isAnalyzingContract: boolean;
  setActiveContract: (contract: Contract | null) => void;
  setActiveReport: (report: Report | null) => void;
  setActiveAnalysis: (report: ContractAnalysisReport | null) => void;
  fetchContracts: () => Promise<void>;
  fetchContractById: (contractId: string) => Promise<Contract | null>;
  fetchReportByContract: (contractId: string) => Promise<Report | null>;
  fetchSharedReport: (shareToken: string) => Promise<Report | null>;
  uploadContract: (payload: { file: File; contractType: string }) => Promise<Contract>;
  analyzeContract: (contractId: string) => Promise<{ contract: Contract; report: Report | null }>;
  saveLawyerReview: (reportId: string, payload: LawyerReviewPayload) => Promise<Report | null>;
  issueTrustSeal: (reportId: string, payload?: { finalVerdict?: string }) => Promise<Report | null>;
  exportReport: (reportId: string) => Promise<ExportReportResponse>;
  shareReport: (reportId: string) => Promise<ShareReportResponse>;
}

export const ContractContext = createContext<ContractContextValue | undefined>(undefined);

const isDetailedAnalysis = (value: unknown): value is ContractAnalysisReport =>
  Boolean(
    value &&
      typeof value === "object" &&
      "contractId" in value &&
      "clauses" in value &&
      "summary" in value,
  );

export const ContractProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<ContractAnalysisReport | null>(null);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);
  const [isAnalyzingContract, setIsAnalyzingContract] = useState(false);

  const storeDetailedAnalysis = async (contractId: string): Promise<void> => {
    try {
      const detailedReport = await fetchStoredContractReport(contractId);
      setActiveAnalysis(detailedReport);
    } catch {
      setActiveAnalysis(null);
    }
  };

  const maybeStoreAnalysisFromReport = (report: Report | null): void => {
    if (report && isDetailedAnalysis(report.aiOutput)) {
      setActiveAnalysis(report.aiOutput);
      return;
    }

    setActiveAnalysis(null);
  };

  const fetchContracts = async (): Promise<void> => {
    setIsLoadingContracts(true);

    try {
      const { data } = await api.get<ContractListResponse>("/contracts");
      setContracts(data.contracts);
      setActiveContract((currentActive) =>
        currentActive
          ? data.contracts.find((contract) => contract._id === currentActive._id) ?? currentActive
          : data.contracts[0] ?? null,
      );
    } finally {
      setIsLoadingContracts(false);
    }
  };

  const fetchContractById = async (contractId: string): Promise<Contract | null> => {
    try {
      const { data } = await api.get<ContractResponse>(`/contracts/${contractId}`);
      setContracts((currentContracts) => {
        const next = currentContracts.filter((contract) => contract._id !== data.contract._id);
        return [data.contract, ...next];
      });
      setActiveContract(data.contract);
      return data.contract;
    } catch {
      return null;
    }
  };

  const uploadContract = async (payload: { file: File; contractType: string }): Promise<Contract> => {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("contractType", payload.contractType);

    const { data } = await api.post<ContractUploadResponse>("/contracts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setContracts((currentContracts) => [data.contract, ...currentContracts]);
    setActiveContract(data.contract);
    return data.contract;
  };

  const fetchReportByContract = async (contractId: string): Promise<Report | null> => {
    try {
      const { data } = await api.get<Report>(`/reports/contract/${contractId}`);
      setActiveReport(data);
      maybeStoreAnalysisFromReport(data);
      return data;
    } catch {
      setActiveReport(null);
      setActiveAnalysis(null);
      return null;
    }
  };

  const fetchSharedReport = async (shareToken: string): Promise<Report | null> => {
    try {
      const { data } = await api.get<Report>(`/reports/shared/${shareToken}`);
      setActiveReport(data);
      maybeStoreAnalysisFromReport(data);
      return data;
    } catch {
      setActiveReport(null);
      setActiveAnalysis(null);
      return null;
    }
  };

  const analyzeContract = async (contractId: string): Promise<{ contract: Contract; report: Report | null }> => {
    setIsAnalyzingContract(true);

    try {
      const { data } = await api.post<ContractAnalysisTriggerResponse>(`/contracts/${contractId}/analyze`);

      setContracts((currentContracts) =>
        currentContracts.map((contract) => (contract._id === data.contract._id ? data.contract : contract)),
      );
      setActiveContract(data.contract);
      setActiveReport(data.report);
      maybeStoreAnalysisFromReport(data.report);
      await storeDetailedAnalysis(contractId);

      return {
        contract: data.contract,
        report: data.report,
      };
    } finally {
      setIsAnalyzingContract(false);
    }
  };

  const saveLawyerReview = async (reportId: string, payload: LawyerReviewPayload): Promise<Report | null> => {
    const { data } = await api.patch<LawyerReviewResponse>(`/reports/${reportId}/lawyer-review`, payload);
    setActiveReport(data.report);
    maybeStoreAnalysisFromReport(data.report);
    return data.report;
  };

  const issueTrustSealAction = async (reportId: string, payload?: { finalVerdict?: string }): Promise<Report | null> => {
    const { data } = await api.post<LawyerReviewResponse>(`/reports/${reportId}/trust-seal`, payload ?? {});
    setActiveReport(data.report);
    maybeStoreAnalysisFromReport(data.report);

    if (data.report?.contractId) {
      await fetchContractById(data.report.contractId);
    }

    return data.report;
  };

  const exportReportAction = async (reportId: string): Promise<ExportReportResponse> => {
    const { data } = await api.post<ExportReportResponse>(`/reports/${reportId}/export`);

    setActiveReport((currentReport) =>
      currentReport && currentReport._id === reportId
        ? {
            ...currentReport,
            exportedPdfUrl: data.exportedPdfUrl,
          }
        : currentReport,
    );

    return data;
  };

  const shareReportAction = async (reportId: string): Promise<ShareReportResponse> => {
    const { data } = await api.post<ShareReportResponse>(`/reports/${reportId}/share`);

    setActiveReport((currentReport) =>
      currentReport && currentReport._id === reportId
        ? {
            ...currentReport,
            shareUrl: data.shareUrl,
            shareExpiresAt: data.shareExpiresAt,
          }
        : currentReport,
    );

    return data;
  };

  const value = useMemo(
    () => ({
      contracts,
      activeContract,
      activeReport,
      activeAnalysis,
      isLoadingContracts,
      isAnalyzingContract,
      setActiveContract,
      setActiveReport,
      setActiveAnalysis,
      fetchContracts,
      fetchContractById,
      fetchReportByContract,
      fetchSharedReport,
      uploadContract,
      analyzeContract,
      saveLawyerReview,
      issueTrustSeal: issueTrustSealAction,
      exportReport: exportReportAction,
      shareReport: shareReportAction,
    }),
    [activeAnalysis, activeContract, activeReport, contracts, isAnalyzingContract, isLoadingContracts],
  );

  return <ContractContext.Provider value={value}>{children}</ContractContext.Provider>;
};
