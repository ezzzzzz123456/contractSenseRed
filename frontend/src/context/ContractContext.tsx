import { createContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Contract, ContractAnalysisReport, Report } from "../types";

interface ContractContextValue {
  activeContract: Contract | null;
  activeReport: Report | null;
  activeAnalysis: ContractAnalysisReport | null;
  setActiveContract: (contract: Contract | null) => void;
  setActiveReport: (report: Report | null) => void;
  setActiveAnalysis: (report: ContractAnalysisReport | null) => void;
}

export const ContractContext = createContext<ContractContextValue | undefined>(undefined);

export const ContractProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<ContractAnalysisReport | null>(null);

  const value = useMemo(
    () => ({
      activeContract,
      activeReport,
      activeAnalysis,
      setActiveContract,
      setActiveReport,
      setActiveAnalysis,
    }),
    [activeAnalysis, activeContract, activeReport],
  );

  return <ContractContext.Provider value={value}>{children}</ContractContext.Provider>;
};

