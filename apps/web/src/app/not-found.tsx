export default function RootNotFound() {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 480, margin: '6rem auto', padding: '0 1rem', textAlign: 'center' }}>
          <p style={{ color: '#B8622E', fontWeight: 600, fontSize: 14 }}>404</p>
          <h1 style={{ marginTop: 8, fontSize: 24, fontWeight: 600 }}>Page introuvable</h1>
          <p style={{ marginTop: 8, color: '#6b6459' }}>
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
          </p>
          <a
            href="/fr"
            style={{
              marginTop: 32,
              display: 'inline-block',
              borderRadius: 9999,
              backgroundColor: '#B8622E',
              color: 'white',
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </body>
    </html>
  );
}
