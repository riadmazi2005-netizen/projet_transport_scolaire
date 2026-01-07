# Instructions pour corriger le problème de photo tronquée

## Problème
La colonne `photo_ticket` dans la table `prise_essence` est en `VARCHAR(255)`, ce qui est trop petit pour stocker des images base64 complètes. Les photos sont donc tronquées à 255 caractères.

## Solution : Exécuter la migration SQL

### Option 1 : Via phpMyAdmin (Recommandé)

1. Ouvrez phpMyAdmin dans votre navigateur (généralement `http://localhost/phpmyadmin`)
2. Sélectionnez la base de données `transport_scolaire`
3. Cliquez sur l'onglet "SQL"
4. Copiez et collez cette commande :

```sql
ALTER TABLE prise_essence MODIFY COLUMN photo_ticket LONGTEXT NULL;
```

5. Cliquez sur "Exécuter"

### Option 2 : Via la ligne de commande MySQL

Ouvrez un terminal et exécutez :

```bash
mysql -u root -p transport_scolaire < backend/migration_fix_photo_ticket_longtext.sql
```

Ou connectez-vous à MySQL et exécutez :

```sql
USE transport_scolaire;
ALTER TABLE prise_essence MODIFY COLUMN photo_ticket LONGTEXT NULL;
```

### Option 3 : Via le script PHP

Si XAMPP est démarré, vous pouvez accéder à :
```
http://localhost/backend/run_migration_photo_ticket.php
```

## Vérification

Après avoir exécuté la migration, vérifiez que la colonne a bien été modifiée :

```sql
SHOW COLUMNS FROM prise_essence WHERE Field = 'photo_ticket';
```

Vous devriez voir `Type: longtext` au lieu de `varchar(255)`.

## Important

⚠️ **Les photos déjà tronquées ne peuvent pas être récupérées.** Vous devrez :
1. Supprimer les anciennes prises d'essence avec des photos tronquées
2. Ajouter de nouvelles prises d'essence avec des photos complètes

## Après la migration

Une fois la migration effectuée :
- Les nouvelles photos seront stockées complètement
- Les photos s'afficheront correctement dans le modal
- Le message d'erreur ne s'affichera plus

