import { createContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import api from "../services/api";
import type {
  Contract,
  ContractAnalysisTriggerResponse,
  ContractListResponse,
  ContractUploadResponse,
  Report,
} from "../types";

interface ContractContextValue {
  contracts: Contract[];
  activeContract: Contract | null;
  activeReport: Report | null;
  isLoadingContracts: boolean;
  isAnalyzingContract: boolean;
  setActiveContract: (contract: Contract | null) => void;
  setActiveReport: (report: Report | null) => void;
  fetchContracts: () => Promise<void>;
  fetchReportByContract: (contractId: string) => Promise<Report | null>;
  uploadContract: (payload: { file: File; contractType: string }) => Promise<Contract>;
  analyzeContract: (contractId: string) => Promise<{ contract: Contract; report: Report | null }>;
}

export const ContractContext = createContext<ContractContextValue | undefined>(undefined);

export const ContractProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);
  const [isAnalyzingContract, setIsAnalyzingContract] = useState(false);

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
      return data;
    } catch {
      setActiveReport(null);
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

      return {
        contract: data.contract,
        report: data.report,
      };
    } finally {
      setIsAnalyzingContract(false);
    }
  };

  const value = useMemo(
    () => ({
      contracts,
      activeContract,
      activeReport,
      isLoadingContracts,
      isAnalyzingContract,
      setActiveContract,
      setActiveReport,
      fetchContracts,
      fetchReportByContract,
      uploadContract,
      analyzeContract,
    }),
    [activeContract, activeReport, contracts, isAnalyzingContract, isLoadingContracts],
  );

  return <ContractContext.Provider value={value}>{children}</ContractContext.Provider>;
};
