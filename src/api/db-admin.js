const express = require('express');
const router = express.Router();
const { Client } = require('pg');

// Endpoint per visualizzare struttura tabella e constraint
router.get('/structure', async (req, res) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const columns = await client.query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_name = 'ai_design_patterns'`
  );
  const constraints = await client.query(
    `SELECT conname AS constraint_name, pg_get_constraintdef(oid) AS constraint_definition
     FROM pg_constraint
     WHERE conrelid = 'ai_design_patterns'::regclass`
  );
  await client.end();
  res.json({
    columns: columns.rows,
    constraints: constraints.rows
  });
});

// Endpoint per rinominare una colonna
router.post('/rename-column', async (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) {
    return res.status(400).json({ error: 'oldName e newName sono obbligatori' });
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(
    `ALTER TABLE ai_design_patterns RENAME COLUMN ${oldName} TO ${newName}`
  );
  await client.end();
  res.json({ success: true, message: `Colonna ${oldName} rinominata in ${newName}` });
});

// Endpoint per aggiungere una UNIQUE constraint
router.post('/add-unique', async (req, res) => {
  const { columnName } = req.body;
  if (!columnName) {
    return res.status(400).json({ error: 'columnName è obbligatorio' });
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const constraintName = `ai_design_patterns_${columnName}_unique`;
  await client.query(
    `ALTER TABLE ai_design_patterns ADD CONSTRAINT ${constraintName} UNIQUE (${columnName})`
  );
  await client.end();
  res.json({ success: true, message: `UNIQUE constraint aggiunta su ${columnName}` });
});

module.exports = router;
