import { CommunityMissionClient } from "./CommunityMissionClient";

interface CommunityMissionPageProps {
  params: Promise<{ missionId: string }>;
}

export default async function CommunityMissionPage({ params }: CommunityMissionPageProps) {
  const { missionId } = await params;
  return <CommunityMissionClient missionId={missionId} />;
}
