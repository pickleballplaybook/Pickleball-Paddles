"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CampaignForm } from "../../_components/CampaignForm";
import type { Campaign } from "../../_components/types";

export default function EditCampaignPage() {
  const params = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/auto-reply/campaigns/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setCampaign(d.campaign);
      })
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>Failed to load:</strong> {error}
        </div>
      </div>
    );
  }
  if (!campaign) {
    return <div className="p-6 text-stone-500">Loading...</div>;
  }

  return <CampaignForm mode="edit" initial={campaign} />;
}
