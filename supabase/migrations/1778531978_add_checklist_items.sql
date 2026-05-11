ALTER TABLE lead_magnets
ADD COLUMN checklist_items jsonb DEFAULT NULL;

COMMENT ON COLUMN lead_magnets.checklist_items IS 'Array de items para tipo checklist: [{ id, text, completed }]';
