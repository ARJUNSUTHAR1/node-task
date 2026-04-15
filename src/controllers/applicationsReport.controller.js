const pool = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const classLabel = (c) => {
  const m = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th" };
  return `${m[c] || c}`;
};

const parseDate = (v) => {
  if (v == null || v === "") return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

function rowRangeForPage(page, totalRows, effectivePages) {
  const base = Math.floor(totalRows / effectivePages);
  const rem = totalRows % effectivePages;
  let start = 1;
  for (let i = 1; i < page; i++) {
    const sz = i <= rem ? base + 1 : base;
    start += sz;
  }
  const size = page <= rem ? base + 1 : base;
  const end = start + size - 1;
  return [start, end];
}

const dateMatchSql = `
  (
    ($1::date IS NULL AND $2::date IS NULL)
    OR ($1::date IS NOT NULL AND $2::date IS NULL AND a.application_date = $1::date)
    OR ($1::date IS NULL AND $2::date IS NOT NULL AND a.application_date = $2::date)
    OR ($1::date IS NOT NULL AND $2::date IS NOT NULL AND a.application_date >= $1::date AND a.application_date <= $2::date)
  )
`;

const getSummary = asyncHandler(async (req, res) => {
  const dateFrom = parseDate(req.query.dateFrom);
  const dateTo = parseDate(req.query.dateTo);
  const totalRows = 6;
  const requestedPages = Math.max(
    1,
    parseInt(req.query.numPages, 10) || 3
  );
  const effectivePages = Math.min(requestedPages, totalRows);
  const page = Math.min(
    Math.max(1, parseInt(req.query.page, 10) || 1),
    effectivePages
  );
  const [startRn, endRn] = rowRangeForPage(page, totalRows, effectivePages);

  const summarySql = `
    WITH params AS (
      SELECT (
        CASE
          WHEN $1::date IS NULL AND $2::date IS NULL THEN CURRENT_DATE
          WHEN $1::date IS NOT NULL AND $2::date IS NULL THEN $1::date
          WHEN $1::date IS NULL AND $2::date IS NOT NULL THEN $2::date
          ELSE $2::date
        END
      )::date AS ref_d
    ),
    agg AS (
      SELECT gs.class,
        COALESCE(COUNT(a.application_id), 0)::int AS received,
        COALESCE(SUM(CASE WHEN a.enrolled THEN 1 ELSE 0 END), 0)::int AS enrolled,
        COALESCE(SUM(CASE WHEN NOT a.enrolled THEN 1 ELSE 0 END), 0)::int AS unenrolled,
        COALESCE(SUM(
          CASE WHEN NOT a.enrolled AND GREATEST(0, (p.ref_d - a.application_date)::int) BETWEEN 0 AND 15
          THEN 1 ELSE 0 END
        ), 0)::int AS u0_15,
        COALESCE(SUM(
          CASE WHEN NOT a.enrolled AND GREATEST(0, (p.ref_d - a.application_date)::int) BETWEEN 16 AND 30
          THEN 1 ELSE 0 END
        ), 0)::int AS u16_30,
        COALESCE(SUM(
          CASE WHEN NOT a.enrolled AND GREATEST(0, (p.ref_d - a.application_date)::int) BETWEEN 31 AND 60
          THEN 1 ELSE 0 END
        ), 0)::int AS u31_60,
        COALESCE(SUM(
          CASE WHEN NOT a.enrolled AND GREATEST(0, (p.ref_d - a.application_date)::int) BETWEEN 61 AND 90
          THEN 1 ELSE 0 END
        ), 0)::int AS u61_90,
        COALESCE(SUM(
          CASE WHEN NOT a.enrolled AND GREATEST(0, (p.ref_d - a.application_date)::int) > 90
          THEN 1 ELSE 0 END
        ), 0)::int AS u_above_90
      FROM generate_series(1, 6) AS gs(class)
      CROSS JOIN params p
      LEFT JOIN applications a ON a.class = gs.class
        AND ${dateMatchSql}
      GROUP BY gs.class
    ),
    numbered AS (
      SELECT *, ROW_NUMBER() OVER (ORDER BY class) AS rn FROM agg
    )
    SELECT
      n.class,
      n.received,
      n.enrolled,
      n.unenrolled,
      n.u0_15,
      n.u16_30,
      n.u31_60,
      n.u61_90,
      n.u_above_90
    FROM numbered n
    WHERE n.rn BETWEEN $3 AND $4
  `;

  const { rows: raw } = await pool.query(summarySql, [
    dateFrom,
    dateTo,
    startRn,
    endRn,
  ]);

  const pageRows = raw.map((r) => ({
    class: r.class,
    label: classLabel(r.class),
    received: r.received,
    enrolled: r.enrolled,
    unenrolled: r.unenrolled,
    u0_15: r.u0_15,
    u16_30: r.u16_30,
    u31_60: r.u31_60,
    u61_90: r.u61_90,
    u_above_90: r.u_above_90,
  }));

  res.status(200).json({
    rows: pageRows,
    page,
    numPagesRequested: requestedPages,
    numPages: effectivePages,
    totalRows,
    totalPages: effectivePages,
    dateFrom,
    dateTo,
  });
});

const getAging = asyncHandler(async (req, res) => {
  const dateFrom = parseDate(req.query.dateFrom);
  const dateTo = parseDate(req.query.dateTo);

  const sql = `
    WITH params AS (
      SELECT (
        CASE
          WHEN $1::date IS NULL AND $2::date IS NULL THEN CURRENT_DATE
          WHEN $1::date IS NOT NULL AND $2::date IS NULL THEN $1::date
          WHEN $1::date IS NULL AND $2::date IS NOT NULL THEN $2::date
          ELSE $2::date
        END
      )::date AS ref_d
    )
    SELECT
      SUM(
        CASE
          WHEN d BETWEEN 0 AND 15 THEN 1
          ELSE 0
        END
      )::int AS "0_15",
      SUM(
        CASE
          WHEN d BETWEEN 16 AND 30 THEN 1
          ELSE 0
        END
      )::int AS "16_30",
      SUM(
        CASE
          WHEN d BETWEEN 31 AND 60 THEN 1
          ELSE 0
        END
      )::int AS "31_60",
      SUM(
        CASE
          WHEN d BETWEEN 61 AND 90 THEN 1
          ELSE 0
        END
      )::int AS "61_90",
      SUM(
        CASE
          WHEN d > 90 THEN 1
          ELSE 0
        END
      )::int AS "above_90"
    FROM (
      SELECT GREATEST(0, (p.ref_d - application_date)::int) AS d
      FROM applications
      CROSS JOIN params p
      WHERE
        ($1::date IS NULL AND $2::date IS NULL)
        OR ($1::date IS NOT NULL AND $2::date IS NULL AND application_date = $1::date)
        OR ($1::date IS NULL AND $2::date IS NOT NULL AND application_date = $2::date)
        OR ($1::date IS NOT NULL AND $2::date IS NOT NULL AND application_date >= $1::date AND application_date <= $2::date)
    ) x
  `;

  const { rows } = await pool.query(sql, [dateFrom, dateTo]);
  const a = rows[0] || {};

  res.status(200).json({
    buckets: [
      { key: "0_15", label: "0–15 days", count: Number(a["0_15"]) || 0 },
      { key: "16_30", label: "16–30 days", count: Number(a["16_30"]) || 0 },
      { key: "31_60", label: "31–60 days", count: Number(a["31_60"]) || 0 },
      { key: "61_90", label: "61–90 days", count: Number(a["61_90"]) || 0 },
      {
        key: "above_90",
        label: "Above 90 days",
        count: Number(a.above_90) || 0,
      },
    ],
    dateFrom,
    dateTo,
  });
});

module.exports = { getSummary, getAging };
