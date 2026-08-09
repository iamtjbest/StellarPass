"use client";

import { useState, useEffect } from "react";
import { isConnected, requestAccess, getAddress, signTransaction } from "@stellar/freighter-api";

export function useFreighter() {
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasFreighter, setHasFreighter] = useState<boolean>(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const connected = await isConnected();
      setHasFreighter(connected.isConnected);
      if (connected.isConnected) {
        const addrRes = await getAddress();
        if (addrRes.address) setPubKey(addrRes.address);
      }
    } catch (e: any) {
      setError(e.message || "Failed to check Freighter connection");
    }
  };

  const connect = async () => {
    try {
      setError(null);
      if (!hasFreighter) {
        setError("Freighter wallet is not installed");
        return null;
      }
      
      const access = await requestAccess();
      if (!access.error) {
        const addrRes = await getAddress();
        if (addrRes.address) {
          setPubKey(addrRes.address);
          return addrRes.address;
        }
      } else {
        setError(access.error || "User rejected access");
        return null;
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to Freighter");
      return null;
    }
  };

  return {
    pubKey,
    error,
    hasFreighter,
    connect,
  };
}
