-- Migration pour ajouter la colonne photos à la table signalements_maintenance
-- Cette colonne stocke les photos en format JSON (array de base64)

-- Vérifier si la colonne existe avant de l'ajouter
SET @dbname = DATABASE();
SET @tablename = 'signalements_maintenance';
SET @columnname = 'photos';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT NULL COMMENT "JSON array of base64 encoded photos"')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

