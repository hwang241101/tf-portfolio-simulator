import { MOCK_MODE_BANNER, useMockApi } from "../lib/mock-mode";

export function MockModeBanner() {
  if (!useMockApi()) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900">
      {MOCK_MODE_BANNER}
    </div>
  );
}
