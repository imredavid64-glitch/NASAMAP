"use client";

import { useState, useEffect, useCallback } from "react";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchAccessToken: (args: { forceRefreshToken: boolean }) => Promise<string | null>;
}

export function useAuth(): AuthState {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== "undefined") {
        let id = localStorage.getItem("nasamap-author-id");
        if (!id) {
          id = "anon-" + Math.random().toString(36).slice(2, 10);
          localStorage.setItem("nasamap-author-id", id);
        }
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
    if (forceRefreshToken) {
      // Force refresh - in a real auth system this would refresh the token
    }
    return "anonymous-token";
  }, []);

  return { isLoading, isAuthenticated, fetchAccessToken };
}