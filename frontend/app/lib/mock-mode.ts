function hasHttpsApiConfigured(): boolean {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  return Boolean(configured?.startsWith("https://"));
}

export function useMockApi(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") return true;
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === "false") return false;
  if (hasHttpsApiConfigured()) return false;

  // Vercel build/SSR: no window yet — rely on VERCEL env
  if (typeof window === "undefined") {
    return process.env.VERCEL === "1";
  }

  // Browser: HTTPS deploy without HTTPS API URL → mock
  return window.location.protocol === "https:";
}

export const MOCK_MODE_BANNER =
  "デモ用モックデータ（クラウドAPI未接続）";
