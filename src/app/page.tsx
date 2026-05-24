export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Running Argentina — jobs</h1>
      <p>
        Cron Vercel (1×/día por job en Hobby):{" "}
        <code>/api/jobs/sync-events</code> y{" "}
        <code>/api/jobs/publish-instagram</code>. Header{" "}
        <code>Authorization: Bearer CRON_SECRET</code>. Para más de un sync
        por día usá el workflow de GitHub Actions en{" "}
        <code>.github/workflows/cron-jobs.yml</code>.
      </p>
    </main>
  );
}
