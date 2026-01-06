-- Migration pour corriger le type de colonne photo_ticket
-- Le type VARCHAR(255) est trop petit pour stocker des images base64
-- On le change en LONGTEXT pour pouvoir stocker de grandes images

ALTER TABLE prise_essence 
MODIFY COLUMN photo_ticket LONGTEXT NULL;

