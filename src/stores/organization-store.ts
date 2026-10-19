"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrganizationResponse } from "@/services/generated/api-types";

interface OrganizationState {
  currentOrganization: OrganizationResponse | null;
  organizations: OrganizationResponse[];
  setCurrentOrganization: (org: OrganizationResponse | null) => void;
  setOrganizations: (orgs: OrganizationResponse[]) => void;
  clearOrganizationState: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      currentOrganization: null,
      organizations: [],
      setCurrentOrganization: (org) => set({ currentOrganization: org }),
      setOrganizations: (orgs) => set({ organizations: orgs }),
      clearOrganizationState: () =>
        set({ currentOrganization: null, organizations: [] }),
    }),
    {
      name: "taskflow_organization_store",
    }
  )
);
