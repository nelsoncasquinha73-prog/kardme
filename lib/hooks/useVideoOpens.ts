import { useEffect, useState } from 'react';

export function useVideoOpensBulk(leadIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leadIds || leadIds.length === 0) return;

    setLoading(true);
    fetch('/api/crm/video-opens/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds }),
    })
      .then((res) => res.json())
      .then((data) => setCounts(data))
      .catch((err) => console.error('[FETCH_VIDEO_OPENS_BULK]', err))
      .finally(() => setLoading(false));
  }, [leadIds.join(',')]); // Re-run when leadIds change

  return { counts, loading };
}
