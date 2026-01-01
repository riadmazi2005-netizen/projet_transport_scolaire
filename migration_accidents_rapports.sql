-- Migration pour ajouter les champs nécessaires aux rapports d'accidents

-- Ajouter les champs manquants à la table accidents
ALTER TABLE accidents 
ADD COLUMN IF NOT EXISTS nombre_eleves INT NULL,
ADD COLUMN IF NOT EXISTS nombre_blesses INT NULL,
ADD COLUMN IF NOT EXISTS photos TEXT NULL,
ADD COLUMN IF NOT EXISTS eleves_concernees TEXT NULL COMMENT 'JSON array des IDs et noms des élèves présents dans le bus',
ADD COLUMN IF NOT EXISTS statut ENUM('En attente', 'Validé') DEFAULT 'En attente' COMMENT 'Statut de validation du rapport par l\'administrateur';

