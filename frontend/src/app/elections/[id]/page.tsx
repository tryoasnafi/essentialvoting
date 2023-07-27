import { redirect } from "next/navigation";

export default function ElectionPage({ params }: { params: { id: string } }) {
  const { id } = params;
  redirect(`/elections/${id}/disclosure`);
}