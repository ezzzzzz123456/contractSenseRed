import { createContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Contract, Report } from "../types";

interface ContractContextValue {
  activeContract: Contract | null;
  activeReport: Report | null;
  setActiveContract: (contract: Contract | null) => void;
  setActiveReport: (report: Report | null) => void;
}

export const ContractContext = createContext<ContractContextValue | undefined>(undefined);

export const ContractProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [activeReport, setActiveReport] = useState<Report | null>(null);

  const value = useMemo(
    () => ({
      activeContract,
      activeReport,
      setActiveContract,
      setActiveReport,
    }),
    [activeContract, activeReport],
  );

  return <ContractContext.Provider value={value}>{children}</ContractContext.Provider>;
};

