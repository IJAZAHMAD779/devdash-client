"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GitHubRepoStats } from "@/types/project";
import { apiClient } from "@/lib/api-client";

interface CachedTelemetryEntry {
  stats: GitHubRepoStats;
  fetchedAt: number;
}

const CACHE_STORAGE_KEY = "devdash_repo_telemetry_cache_v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_CONCURRENT_REQUESTS = 3;

// Global in-memory cache shared across all components and view switches
const memoryCache = new Map<string, CachedTelemetryEntry>();
let isStorageLoaded = false;
let globalRateLimited = false;

// Concurrency queue
interface QueueTask {
  cleanUrl: string;
  repoUrl: string;
  resolve: (value: GitHubRepoStats | null) => void;
}

const requestQueue: QueueTask[] = [];
let activeRequests = 0;
const inFlightRequests = new Map<string, Promise<GitHubRepoStats | null>>();
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => cb());
}

function loadStorageCache() {
  if (isStorageLoaded || typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (raw) {
      const parsed: Record<string, CachedTelemetryEntry> = JSON.parse(raw);
      Object.entries(parsed).forEach(([k, v]) => {
        if (v && v.stats && typeof v.fetchedAt === "number") {
          memoryCache.set(k, v);
        }
      });
    }
  } catch (e) {
    console.warn("[useRepoTelemetry] Failed to parse localStorage cache:", e);
  }
  isStorageLoaded = true;
}

function saveStorageCache() {
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, CachedTelemetryEntry> = {};
    memoryCache.forEach((val, key) => {
      // Keep entries younger than 7 days in storage
      if (Date.now() - val.fetchedAt < 7 * 24 * 60 * 60 * 1000) {
        obj[key] = val;
      }
    });
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn("[useRepoTelemetry] Failed to persist to localStorage:", e);
  }
}

function normalizeRepoKey(url: string): string | null {
  try {
    const match = url.match(/github\.com\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/i);
    if (!match) return null;
    const owner = match[1].toLowerCase();
    const repo = match[2].toLowerCase().replace(/\.git$/i, "");
    return `${owner}/${repo}`;
  } catch {
    return null;
  }
}

async function processQueue() {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
    return;
  }

  const task = requestQueue.shift();
  if (!task) return;

  activeRequests++;

  try {
    const res = await apiClient.get<GitHubRepoStats>(
      `/projects/github-stats?repoUrl=${encodeURIComponent(task.repoUrl)}`
    );

    if (res && res.fullName) {
      const entry: CachedTelemetryEntry = {
        stats: res,
        fetchedAt: Date.now(),
      };
      memoryCache.set(task.cleanUrl, entry);
      saveStorageCache();
      notifySubscribers();
      task.resolve(res);
    } else {
      task.resolve(null);
    }
  } catch (err: any) {
    const status = err?.response?.status || err?.status;
    if (status === 403 || status === 429) {
      globalRateLimited = true;
      notifySubscribers();
    }
    // Return existing cached data if any, or null without crashing
    const existing = memoryCache.get(task.cleanUrl);
    task.resolve(existing ? existing.stats : null);
  } finally {
    activeRequests--;
    inFlightRequests.delete(task.cleanUrl);
    processQueue();
  }
}

function enqueueFetch(repoUrl: string, cleanKey: string): Promise<GitHubRepoStats | null> {
  const existingPromise = inFlightRequests.get(cleanKey);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = new Promise<GitHubRepoStats | null>((resolve) => {
    requestQueue.push({ cleanUrl: cleanKey, repoUrl, resolve });
    processQueue();
  });

  inFlightRequests.set(cleanKey, promise);
  return promise;
}

export interface RepoTelemetryResult {
  stats: GitHubRepoStats | null;
  isLoading: boolean;
  fetchedAt: number | null;
  isStale: boolean;
  isRateLimited: boolean;
}

/**
 * Shared repository telemetry hook used by Workbench, Data Grid, and Cards.
 * Implements SWR with 6h TTL, concurrency limiting, and localStorage persistence.
 */
export function useRepoTelemetry(repoUrl: string | null | undefined): RepoTelemetryResult {
  loadStorageCache();

  const cleanKey = repoUrl ? normalizeRepoKey(repoUrl) : null;
  const cached = cleanKey ? memoryCache.get(cleanKey) : null;

  const [, setTick] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const update = () => {
      if (mountedRef.current) {
        setTick((t) => t + 1);
      }
    };
    subscribers.add(update);
    return () => {
      mountedRef.current = false;
      subscribers.delete(update);
    };
  }, []);

  useEffect(() => {
    if (!repoUrl || !cleanKey) return;

    const currentCached = memoryCache.get(cleanKey);
    const isExpired = !currentCached || Date.now() - currentCached.fetchedAt > CACHE_TTL_MS;

    if (isExpired && !inFlightRequests.has(cleanKey)) {
      enqueueFetch(repoUrl, cleanKey);
    }
  }, [repoUrl, cleanKey]);

  if (!repoUrl || !cleanKey) {
    return {
      stats: null,
      isLoading: false,
      fetchedAt: null,
      isStale: false,
      isRateLimited: globalRateLimited,
    };
  }

  const entry = memoryCache.get(cleanKey);

  return {
    stats: entry ? entry.stats : null,
    isLoading: !entry && inFlightRequests.has(cleanKey),
    fetchedAt: entry ? entry.fetchedAt : null,
    isStale: entry ? Date.now() - entry.fetchedAt > CACHE_TTL_MS : false,
    isRateLimited: globalRateLimited,
  };
}

export function useIsTelemetryRateLimited(): boolean {
  const [rateLimited, setRateLimited] = useState(globalRateLimited);
  useEffect(() => {
    const cb = () => setRateLimited(globalRateLimited);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);
  return rateLimited;
}
