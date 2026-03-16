import axios from "axios";
import type {
  ContractAnalysisReport,
  ContractIngestionPayload,
  OutcomeMessage,
  OutcomeSimulationResponse,
} from "../types";

const AUTH_STORAGE_KEY = "contractsense.auth.token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001/api",
  withCredentials: true,
});

export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  delete api.defaults.headers.common.Authorization;
};

export const getStoredAuthToken = (): string | null => localStorage.getItem(AUTH_STORAGE_KEY);

const initialToken = getStoredAuthToken();
if (initialToken) {
  api.defaults.headers.common.Authorization = `Bearer ${initialToken}`;
}

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
