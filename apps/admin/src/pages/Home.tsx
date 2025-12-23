import { Layout } from "@/components/Layout";

export default function Home() {
  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Home</h1>
          <p className="text-muted-foreground">
            Esta página está em desenvolvimento. Novidades em breve!
          </p>
        </div>
      </div>
    </Layout>
  );
}
