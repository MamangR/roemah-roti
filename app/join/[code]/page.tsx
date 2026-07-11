import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{
    code: string;
  }>;
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params;
  redirect(`/register?ref=${encodeURIComponent(code)}`);
}
