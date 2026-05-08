import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Agence, Vehicule, Client } from "@/types";

interface StepperState {
  step: number;
  agence: Agence | null;
  client: Client | null;
  vehicule: Vehicule | null;
  date: string | null; // ISO date (yyyy-mm-dd)
  heure: string | null;
  notes: string;
  termsAccepted: boolean;

  setStep: (s: number) => void;
  next: () => void;
  prev: () => void;
  setAgence: (a: Agence | null) => void;
  setClient: (c: Client | null) => void;
  setVehicule: (v: Vehicule | null) => void;
  setSlot: (date: string, heure: string) => void;
  setNotes: (n: string) => void;
  setTerms: (b: boolean) => void;
  reset: () => void;
}

export const useStepperStore = create<StepperState>()(
  persist(
    (set, get) => ({
      step: 1,
      agence: null,
      client: null,
      vehicule: null,
      date: null,
      heure: null,
      notes: "",
      termsAccepted: false,
      setStep: (s) => set({ step: s }),
      next: () => set({ step: Math.min(5, get().step + 1) }),
      prev: () => set({ step: Math.max(1, get().step - 1) }),
      setAgence: (a) => set({ agence: a }),
      setClient: (c) => set({ client: c }),
      setVehicule: (v) => set({ vehicule: v }),
      setSlot: (date, heure) => set({ date, heure }),
      setNotes: (n) => set({ notes: n }),
      setTerms: (b) => set({ termsAccepted: b }),
      reset: () =>
        set({
          step: 1,
          agence: null,
          client: null,
          vehicule: null,
          date: null,
          heure: null,
          notes: "",
          termsAccepted: false,
        }),
    }),
    { name: "renault-stepper" }
  )
);
