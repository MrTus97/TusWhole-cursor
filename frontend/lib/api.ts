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
      withCredentials: true, // Gửi cookies để giữ session
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

  // Funds
  async getFunds(params?: any) {
    const response = await this.client.get("/api/finance/funds/", {
      params,
    });
    return response.data;
  }

  async createFund(data: any) {
    const response = await this.client.post("/api/finance/funds/", data);
    return response.data;
  }

  async updateFund(id: number, data: any) {
    const response = await this.client.patch(`/api/finance/funds/${id}/`, data);
    return response.data;
  }

  async deleteFund(id: number) {
    await this.client.delete(`/api/finance/funds/${id}/`);
  }

  // OAuth methods
  async getOAuthUrl(provider: "google" | "facebook" | "github", redirectUri?: string) {
    const response = await this.client.get(`/api/oauth/${provider}/url/`, {
      params: redirectUri ? { redirect_uri: redirectUri } : {},
    });
    return response.data.auth_url;
  }

  async handleOAuthCallback(provider: "google" | "facebook" | "github", code: string, state: string) {
    const response = await this.client.post(`/api/oauth/${provider}/callback/`, {
      code,
      state,
    });
    return response.data;
  }

  // Contacts methods
  async getContacts(params?: any) {
    const response = await this.client.get("/api/contacts/contacts/", {
      params,
    });
    return response.data;
  }

  async createContact(data: any) {
    const response = await this.client.post("/api/contacts/contacts/", data);
    return response.data;
  }

  async updateContact(id: number, data: any) {
    const response = await this.client.patch(`/api/contacts/contacts/${id}/`, data);
    return response.data;
  }

  async deleteContact(id: number) {
    await this.client.delete(`/api/contacts/contacts/${id}/`);
  }

  // Occupations
  async getOccupations(params?: any) {
    const response = await this.client.get("/api/categories/occupations/", {
      params,
    });
    return response.data;
  }

  async createOccupation(data: any) {
    const response = await this.client.post("/api/categories/occupations/", data);
    return response.data;
  }
  
  async updateOccupation(id: number, data: any) {
    const response = await this.client.patch(`/api/categories/occupations/${id}/`, data);
    return response.data;
  }
  
  async deleteOccupation(id: number) {
    await this.client.delete(`/api/categories/occupations/${id}/`);
  }

  // Custom Fields methods
  async getCustomFields(params?: any) {
    const response = await this.client.get("/api/custom-fields/custom-fields/", {
      params,
    });
    return response.data;
  }

  async createCustomField(data: any) {
    const response = await this.client.post("/api/custom-fields/custom-fields/", data);
    return response.data;
  }

  async updateCustomField(id: number, data: any) {
    const response = await this.client.patch(
      `/api/custom-fields/custom-fields/${id}/`,
      data
    );
    return response.data;
  }

  async deleteCustomField(id: number) {
    await this.client.delete(`/api/custom-fields/custom-fields/${id}/`);
  }

  // Filter metadata methods
  async getWalletFilterMetadata() {
    const response = await this.client.get("/api/finance/filter-metadata/wallets/");
    return response.data;
  }

  async getTransactionFilterMetadata() {
    const response = await this.client.get("/api/finance/filter-metadata/transactions/");
    return response.data;
  }

  async getContactFilterMetadata() {
    const response = await this.client.get("/api/contacts/filter-metadata/contacts/");
    return response.data;
  }

  async getJournalFilterMetadata() {
    const response = await this.client.get("/api/journal/filter-metadata/entries/");
    return response.data;
  }

  async getCustomFieldFilterMetadata() {
    const response = await this.client.get("/api/custom-fields/filter-metadata/custom-fields/");
    return response.data;
  }

  // Journal methods
  async getJournalEntries(params?: any) {
    const response = await this.client.get("/api/journal/entries/", {
      params,
    });
    return response.data;
  }

  async createJournalEntry(data: any) {
    const response = await this.client.post("/api/journal/entries/", data);
    return response.data;
  }

  async updateJournalEntry(id: number, data: any) {
    const response = await this.client.patch(`/api/journal/entries/${id}/`, data);
    return response.data;
  }

  async deleteJournalEntry(id: number) {
    await this.client.delete(`/api/journal/entries/${id}/`);
  }

  async getJournalHashtags(params?: any) {
    const response = await this.client.get("/api/journal/hashtags/", {
      params,
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();

