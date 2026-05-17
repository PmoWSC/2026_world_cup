import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

// Bumping the version (e.g. v2) forces the modal to show again — useful
// if the disclaimer text changes materially.
const STORAGE_KEY = "disclaimer_accepted_v1";

export function useDisclaimer() {
  const [state, setState] = useState({ loading: true, accepted: false });

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((value) => {
        if (!cancelled) setState({ loading: false, accepted: !!value });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, accepted: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const accept = async () => {
    const payload = JSON.stringify({ acceptedAt: new Date().toISOString() });
    await SecureStore.setItemAsync(STORAGE_KEY, payload);
    setState({ loading: false, accepted: true });
  };

  return { ...state, accept };
}
