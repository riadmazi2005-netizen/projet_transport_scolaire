-- Script pour corriger la taille des colonnes photos
-- Exécutez ce script dans votre base de données 'transport_scolaire' (via PhpMyAdmin par exemple)

-- 1. Corriger la table des prises d'essence
ALTER TABLE prise_essence MODIFY COLUMN photo_ticket LONGTEXT;

-- 2. Corriger la table des accidents
ALTER TABLE accidents MODIFY COLUMN photos LONGTEXT;

-- 3. Corriger la table des signalements
ALTER TABLE signalements MODIFY COLUMN photos LONGTEXT;
