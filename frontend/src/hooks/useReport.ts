import { useContract } from "./useContract";

export const useReport = () => {
  const { activeReport, setActiveReport } = useContract();

  return {
    activeReport,
    setActiveReport,
  };
};

