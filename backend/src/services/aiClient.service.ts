import axios from "axios";
import { env } from "../config/env";

const aiHttp = axios.create({
  baseURL: env.aiServiceUrl,
  timeout: 30000,
});

export const aiClient = {
  post: async <TResponse>(path: string, payload: unknown): Promise<TResponse> => {
    const { data } = await aiHttp.post<TResponse>(path, payload);
    return data;
  },
};

