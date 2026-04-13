import { create } from "zustand";
import type { RecommendRequest, RecommendResponse } from "@/types/api";

interface AppStore {
  formData: Partial<RecommendRequest>;
  result: RecommendResponse | null;
  setFormData: (data: Partial<RecommendRequest>) => void;
  setResult: (result: RecommendResponse) => void;
  reset: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  formData: {},
  result: null,
  setFormData: (data) =>
    set((s) => ({ formData: { ...s.formData, ...data } })),
  setResult: (result) => set({ result }),
  reset: () => set({ formData: {}, result: null }),
}));
