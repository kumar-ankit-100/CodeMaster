
import { Contest } from "@/components/Contest";

export default function ContestPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { sessionId?: string }; // ✅ query params from URL
}) {
  const sessionId = searchParams.sessionId ?? '';

  if (!params.id) {
    return <div>Contest doesn't exist...</div>;
  }

  return <Contest id={params.id} sessionId={sessionId} />;
}
