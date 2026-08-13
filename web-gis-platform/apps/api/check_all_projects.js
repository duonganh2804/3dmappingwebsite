const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query('SELECT id, name, "centerLon", "centerLat", epsg, "pointCloudId", calibration FROM "Project"');
    console.log("ALL PROJECTS:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error querying database:", err);
  } finally {
    await pool.end();
  }
}

run();
