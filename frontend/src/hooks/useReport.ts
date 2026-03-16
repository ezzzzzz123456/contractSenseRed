import { useContract } from "./useContract";

export const useReport = () => {
  const { activeAnalysis, activeReport, setActiveAnalysis, setActiveReport } = useContract();

  return {
    activeAnalysis,
    activeReport,
    setActiveAnalysis,
    setActiveReport,
  };
};

