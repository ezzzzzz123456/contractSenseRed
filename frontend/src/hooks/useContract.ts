import { useContext } from "react";
import { ContractContext } from "../context/ContractContext";

export const useContract = () => {
  const context = useContext(ContractContext);

  if (!context) {
    throw new Error("useContract must be used within ContractProvider");
  }

  return context;
};

