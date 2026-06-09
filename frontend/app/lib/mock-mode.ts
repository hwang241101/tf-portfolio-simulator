function wouldUseApiProxy(): boolean {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return !configured || configured.startsWith("http://");
  }
  return false;
}

export function useMockApi(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") return true;
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === "false") return false;
  // Vercel(HTTPS) with no HTTPS API → skip dead /api-proxy, use in-browser mock
  return wouldUseApiProxy();
}

export const MOCK_MODE_BANNER =
  "デモ用モックデータ（クラウドAPI未接続）";
