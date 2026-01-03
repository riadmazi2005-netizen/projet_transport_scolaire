-- Migration pour modifier la colonne photos en LONGTEXT si elle existe en TEXT
-- Cela permet de stocker des images base64 plus grandes

-- Vérifier si la colonne existe et son type
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'signalements_maintenance'
    AND COLUMN_NAME = 'photos'
);

-- Si la colonne existe et est TEXT, la modifier en LONGTEXT
SET @sql = IF(@column_exists > 0,
  'ALTER TABLE signalements_maintenance MODIFY COLUMN photos LONGTEXT NULL COMMENT ''JSON array of base64 encoded photos''',
  'SELECT ''Column does not exist, run migration_add_photos_signalements.sql first'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

