-- Script de vérification et ajout de la colonne photos si elle n'existe pas

-- Vérifier si la colonne existe
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'signalements_maintenance'
  AND COLUMN_NAME = 'photos';

-- Si la colonne n'existe pas, l'ajouter
ALTER TABLE signalements_maintenance 
ADD COLUMN photos TEXT NULL COMMENT 'JSON array of base64 encoded photos';

