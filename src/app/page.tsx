import AgentMobile from "@/components/AgentMobile";

// Tell Next.js to render this page at request time (skip prerender)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return <AgentMobile />;
}
