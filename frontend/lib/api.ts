import axios, { AxiosInstance } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use((config) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Add response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem("refresh_token");
            if (refreshToken) {
              const response = await axios.post(
                `${API_BASE_URL}/api/token/refresh/`,
                { refresh: refreshToken }
              );
              const { access } = response.data;
              localStorage.setItem("access_token", access);
              originalRequest.headers.Authorization = `Bearer ${access}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async login(username: string, password: string) {
    const response = await this.client.post("/api/token/", {
      username,
      password,
    });
    return response.data;
  }

  async getWallets() {
    const response = await this.client.get("/api/finance/wallets/");
    return response.data;
  }

  async createWallet(data: any) {
    const response = await this.client.post("/api/finance/wallets/", data);
    return response.data;
  }

  async updateWallet(id: number, data: any) {
    const response = await this.client.patch(`/api/finance/wallets/${id}/`, data);
    return response.data;
  }

  async deleteWallet(id: number) {
    await this.client.delete(`/api/finance/wallets/${id}/`);
  }

  async getTransactions(params?: any) {
    const response = await this.client.get("/api/finance/transactions/", {
      params,
    });
    return response.data;
  }

  async createTransaction(data: any) {
    const response = await this.client.post("/api/finance/transactions/", data);
    return response.data;
  }

  async updateTransaction(id: number, data: any) {
    const response = await this.client.patch(
      `/api/finance/transactions/${id}/`,
      data
    );
    return response.data;
  }

  async deleteTransaction(id: number) {
    await this.client.delete(`/api/finance/transactions/${id}/`);
  }

  async getCategories(walletId?: number) {
    const response = await this.client.get("/api/finance/categories/", {
      params: walletId ? { wallet: walletId } : {},
    });
    return response.data;
  }

  async getCategoryTemplates() {
    const response = await this.client.get("/api/finance/category-templates/");
    return response.data;
  }
}

export const apiClient = new ApiClient();

