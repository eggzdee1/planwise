export default async function Home() {
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}`);
  return <main className="min-h-screen"></main>;
}

