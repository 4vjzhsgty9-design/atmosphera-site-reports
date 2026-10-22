export function ConfigurationNeeded() {
  return (
    <main className="auth-page">
      <section className="panel padded auth-card">
        <div className="eyebrow">ATMOSPHERA / CONNECTED WORKSPACE</div>
        <h1>Configuration required</h1>
        <p>
          Connected mode is selected, but Supabase settings are incomplete or
          invalid. Ask the administrator to follow docs/supabase-setup-ru.md and
          restart the server.
        </p>
        <p>No demonstration data is loaded in connected mode.</p>
      </section>
    </main>
  );
}
