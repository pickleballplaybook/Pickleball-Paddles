import { CampaignForm } from "../_components/CampaignForm";
import { MOCK_CAMPAIGNS } from "../_components/mockData";
import { notFound } from "next/navigation";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === id);
  if (!campaign) notFound();
  return <CampaignForm mode="edit" initial={campaign} />;
}
