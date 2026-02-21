import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook that persists a value in the cloud (user_settings table).
 * On first load, migrates from localStorage if cloud has no data.
 * After migration, removes the localStorage key.
 */
export function useCloudSetting<T>(
  key: string,
  defaultValue: T,
  localStorageKey?: string
): [T, (val: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValue = useRef<T>(defaultValue);

  // Load from cloud on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("user_settings")
        .select("value")
        .eq("user_id", user.id)
        .eq("key", key)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        const val = data.value as T;
        setValue(val);
        latestValue.current = val;
        // Clean up localStorage if it exists
        if (localStorageKey) localStorage.removeItem(localStorageKey);
      } else if (localStorageKey) {
        // Migrate from localStorage
        const raw = localStorage.getItem(localStorageKey);
        if (raw !== null) {
          try {
            const parsed = JSON.parse(raw) as T;
            setValue(parsed);
            latestValue.current = parsed;
            // Save to cloud
            await supabase.from("user_settings").upsert(
              { user_id: user.id, key, value: parsed as any },
              { onConflict: "user_id,key" }
            );
            localStorage.removeItem(localStorageKey);
          } catch {
            // If JSON parse fails, store raw string
            setValue(raw as unknown as T);
            latestValue.current = raw as unknown as T;
          }
        }
      }
      setLoaded(true);
    };
    load();
    return () => { cancelled = true; };
  }, [key, localStorageKey]);

  // Debounced save to cloud
  const saveToCloud = useCallback((val: T) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_settings").upsert(
        { user_id: user.id, key, value: val as any },
        { onConflict: "user_id,key" }
      );
    }, 500);
  }, [key]);

  const setAndSave = useCallback((valOrFn: T | ((prev: T) => T)) => {
    const newVal = typeof valOrFn === "function"
      ? (valOrFn as (prev: T) => T)(latestValue.current)
      : valOrFn;
    latestValue.current = newVal;
    setValue(newVal);
    saveToCloud(newVal);
  }, [saveToCloud]);

  return [value, setAndSave, loaded];
}
