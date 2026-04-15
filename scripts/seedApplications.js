const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const specs = [
  { class: 1, total: 50, enrolled: 20 },
  { class: 2, total: 60, enrolled: 10 },
  { class: 3, total: 70, enrolled: 30 },
  { class: 4, total: 40, enrolled: 20 },
  { class: 5, total: 100, enrolled: 60 },
  { class: 6, total: 60, enrolled: 30 },
];

const startUtc = Date.UTC(2025, 4, 1);
const endUtc = Date.UTC(2026, 4, 1);

function randomDateInclusive() {
  const spanDays = Math.round((endUtc - startUtc) / 86400000);
  const offset = Math.floor(Math.random() * (spanDays + 1));
  return new Date(startUtc + offset * 86400000).toISOString().slice(0, 10);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        application_id SERIAL PRIMARY KEY,
        application_date DATE NOT NULL,
        class SMALLINT NOT NULL CHECK (class >= 1 AND class <= 6),
        enrolled BOOLEAN NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_applications_date ON applications (application_date);
      CREATE INDEX IF NOT EXISTS idx_applications_class ON applications (class);
    `);

    await client.query("TRUNCATE TABLE applications RESTART IDENTITY");

    const values = [];
    const params = [];
    let n = 1;

    for (const s of specs) {
      const flags = [
        ...Array(s.enrolled).fill(true),
        ...Array(s.total - s.enrolled).fill(false),
      ];
      const ordered = shuffle(flags);
      for (const enrolled of ordered) {
        values.push(`($${n++}, $${n++}, $${n++})`);
        params.push(randomDateInclusive(), s.class, enrolled);
      }
    }

    await client.query(
      `
      INSERT INTO applications (application_date, class, enrolled)
      VALUES ${values.join(", ")}
      `,
      params
    );

    const { rows } = await client.query(`
      SELECT class,
        COUNT(*)::int AS received,
        SUM(CASE WHEN enrolled THEN 1 ELSE 0 END)::int AS enrolled,
        SUM(CASE WHEN NOT enrolled THEN 1 ELSE 0 END)::int AS unenrolled
      FROM applications
      GROUP BY class
      ORDER BY class
    `);

    console.log(rows);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
