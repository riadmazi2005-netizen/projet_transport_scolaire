-- Migration pour ajouter la colonne photos à la table accidents si elle n'existe pas
-- Utilise LONGTEXT pour supporter les grandes images base64

-- Vérifier si la colonne existe
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accidents'
    AND COLUMN_NAME = 'photos'
);

-- Si la colonne n'existe pas, l'ajouter
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE accidents ADD COLUMN photos LONGTEXT NULL COMMENT ''JSON array of base64 encoded photos''',
  'SELECT ''Column already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Si la colonne existe mais est TEXT, la modifier en LONGTEXT
SET @column_type = (
  SELECT DATA_TYPE 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'accidents'
    AND COLUMN_NAME = 'photos'
);

SET @sql2 = IF(@column_type = 'text' AND @column_exists > 0,
  'ALTER TABLE accidents MODIFY COLUMN photos LONGTEXT NULL COMMENT ''JSON array of base64 encoded photos''',
  'SELECT ''Column type is OK or column does not exist'' AS message'
);

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

