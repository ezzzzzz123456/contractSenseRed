import axios from "axios";
import type {
  ContractAnalysisReport,
  ContractIngestionPayload,
  OutcomeMessage,
  OutcomeSimulationResponse,
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api",
  withCredentials: true,
});

export const uploadContractForAnalysis = async (
  payload: ContractIngestionPayload,
): Promise<ContractAnalysisReport> => {
  const { data } = await api.post<ContractAnalysisReport>("/ai/intelligence/report", payload);
  return data;
};

export const fetchStoredContractReport = async (contractId: string): Promise<ContractAnalysisReport> => {
  const { data } = await api.get<ContractAnalysisReport>(`/ai/intelligence/contracts/${contractId}`);
  return data;
};

export const simulateContractOutcome = async (
  contractId: string,
  messages: OutcomeMessage[],
): Promise<OutcomeSimulationResponse> => {
  const { data } = await api.post<OutcomeSimulationResponse>("/ai/outcome-sim", {
    contractId,
    messages,
  });
  return data;
};

export default api;

