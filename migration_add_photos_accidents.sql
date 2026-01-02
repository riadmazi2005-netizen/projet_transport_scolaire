-- Migration: Ajouter le champ photos à la table accidents
-- Date: 2024

ALTER TABLE accidents 
ADD COLUMN photos TEXT NULL COMMENT 'JSON array of base64 encoded photos';

