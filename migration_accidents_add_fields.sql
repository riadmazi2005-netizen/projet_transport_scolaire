-- Migration: Ajouter les champs manquants à la table accidents
-- Date: 2024

-- Ajouter les colonnes nombre_eleves, nombre_blesses, et photos
ALTER TABLE accidents 
ADD COLUMN IF NOT EXISTS nombre_eleves INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS nombre_blesses INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS photos TEXT DEFAULT NULL COMMENT 'JSON array of photo URLs/base64';

-- Note: Si votre version de MySQL ne supporte pas IF NOT EXISTS, utilisez simplement:
-- ALTER TABLE accidents 
-- ADD COLUMN nombre_eleves INT DEFAULT NULL,
-- ADD COLUMN nombre_blesses INT DEFAULT NULL,
-- ADD COLUMN photos TEXT DEFAULT NULL;

