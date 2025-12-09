import { useState, useEffect, useCallback } from "react";

const DRAFTS_KEY = "tiller_drafts";
const PROFILE_KEY = "tiller_profile";
const MAX_DRAFTS = 5;

export interface DraftDocument {
  id: string;
  document_type: string;
  title: string;
  form_data: any;
  attachments: any[];
  created_at: string;
  updated_at: string;
}

export interface ProfileData {
  full_name: string;
  employee_id: string;
  designation: string;
  mobile_number: string;
}

// Generate a simple unique ID
const generateId = () => `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function useDrafts() {
  const [drafts, setDrafts] = useState<DraftDocument[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(DRAFTS_KEY);
    if (stored) {
      try {
        setDrafts(JSON.parse(stored));
      } catch {
        setDrafts([]);
      }
    }
  }, []);

  const saveDrafts = useCallback((newDrafts: DraftDocument[]) => {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(newDrafts));
    setDrafts(newDrafts);
  }, []);

  const saveDraft = useCallback((draft: Omit<DraftDocument, "id" | "created_at" | "updated_at">, existingId?: string) => {
    const now = new Date().toISOString();
    
    let updatedDrafts = [...drafts];
    
    if (existingId) {
      // Update existing draft
      const index = updatedDrafts.findIndex(d => d.id === existingId);
      if (index !== -1) {
        updatedDrafts[index] = {
          ...updatedDrafts[index],
          ...draft,
          updated_at: now,
        };
      } else {
        // If not found, create new
        updatedDrafts.push({
          ...draft,
          id: existingId,
          created_at: now,
          updated_at: now,
        });
      }
    } else {
      // Create new draft
      const newDraft: DraftDocument = {
        ...draft,
        id: generateId(),
        created_at: now,
        updated_at: now,
      };
      updatedDrafts.push(newDraft);
    }

    // Sort by updated_at descending
    updatedDrafts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    // Keep only MAX_DRAFTS (remove oldest if overflow)
    if (updatedDrafts.length > MAX_DRAFTS) {
      updatedDrafts = updatedDrafts.slice(0, MAX_DRAFTS);
    }

    saveDrafts(updatedDrafts);
    return updatedDrafts.find(d => existingId ? d.id === existingId : d.created_at === now)?.id;
  }, [drafts, saveDrafts]);

  const deleteDraft = useCallback((id: string) => {
    const updatedDrafts = drafts.filter(d => d.id !== id);
    saveDrafts(updatedDrafts);
  }, [drafts, saveDrafts]);

  const getDraft = useCallback((id: string) => {
    return drafts.find(d => d.id === id);
  }, [drafts]);

  return { drafts, saveDraft, deleteDraft, getDraft };
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    employee_id: "",
    designation: "",
    mobile_number: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {
        // Keep default
      }
    }
  }, []);

  const saveProfile = useCallback((data: ProfileData) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
    setProfile(data);
  }, []);

  return { profile, saveProfile };
}
