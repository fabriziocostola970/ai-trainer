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

// Endpoint per cancellare tutti i dati dalla tabella ai_design_patterns
router.delete('/clear-patterns', async (req, res) => {
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    
    // Prima conta i record esistenti
    const countResult = await client.query('SELECT COUNT(*) FROM ai_design_patterns');
    const recordCount = parseInt(countResult.rows[0].count);
    
    // Cancella tutti i record
    await client.query('DELETE FROM ai_design_patterns');
    
    // Reset della sequenza auto-increment per l'ID (opzionale)
    await client.query('ALTER SEQUENCE ai_design_patterns_id_seq RESTART WITH 1');
    
    await client.end();
    
    res.json({ 
      success: true, 
      message: 'Tabella ai_design_patterns svuotata completamente',
      deletedCount: recordCount
    });
    
  } catch (error) {
    console.error('❌ Errore cancellazione tabella:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore durante la cancellazione della tabella',
      details: error.message 
    });
  }
});

module.exports = router;
