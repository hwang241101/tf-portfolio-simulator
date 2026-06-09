export function useMockApi(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
}

export const MOCK_MODE_BANNER =
  "デモ用モックデータ（クラウドAPI未接続）";
