import { useState, useCallback } from "react";

export interface UserPreferences {
  favoriteCategories: string[];
  notificationEnabled: boolean;
}

const STORAGE_KEY = "go-market-preferences";

const defaults: UserPreferences = {
  favoriteCategories: [],
  notificationEnabled: true,
};

function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as UserPreferences) : defaults;
  } catch {
    return defaults;
  }
}

function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);

  const updateCategory = useCallback((category: string, add: boolean) => {
    setPreferences((prev) => {
      const next = add
        ? [...new Set([...prev.favoriteCategories, category])]
        : prev.favoriteCategories.filter((c) => c !== category);
      const updated = { ...prev, favoriteCategories: next };
      savePreferences(updated);
      return updated;
    });
  }, []);

  const toggleNotifications = useCallback(() => {
    setPreferences((prev) => {
      const updated = { ...prev, notificationEnabled: !prev.notificationEnabled };
      savePreferences(updated);
      return updated;
    });
  }, []);

  const reset = useCallback(() => {
    savePreferences(defaults);
    setPreferences(defaults);
  }, []);

  return { preferences, updateCategory, toggleNotifications, reset };
}
