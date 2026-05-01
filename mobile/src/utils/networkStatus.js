import { useState, useEffect } from 'react';
import { API_URL } from './constants';

const HEALTH_URL = API_URL.replace('/graphql', '/health');
const CHECK_INTERVAL_MS = 30000;

async function checkConnectivity() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(HEALTH_URL, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let intervalId;

    const runCheck = async () => {
      const online = await checkConnectivity();
      setIsOnline(online);
    };

    runCheck();
    intervalId = setInterval(runCheck, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return { isOnline };
}
