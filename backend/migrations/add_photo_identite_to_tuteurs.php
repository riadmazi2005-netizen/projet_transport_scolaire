<?php
require_once '../config/database.php';

try {
    $pdo = getDBConnection();
    
    // Vérifier si la colonne existe déjà
    $stmt = $pdo->query("SHOW COLUMNS FROM tuteurs LIKE 'photo_identite'");
    $exists = $stmt->fetch();
    
    if (!$exists) {
        // Ajouter la colonne photo_identite
        $sql = "ALTER TABLE tuteurs ADD COLUMN photo_identite VARCHAR(255) NULL AFTER adresse";
        $pdo->exec($sql);
        echo "Colonne 'photo_identite' ajoutée avec succès à la table 'tuteurs'.\n";
    } else {
        echo "La colonne 'photo_identite' existe déjà dans la table 'tuteurs'.\n";
    }
    
    // Créer le dossier d'upload si nécessaire
    $uploadDir = '../uploads/tuteurs';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
        echo "Dossier '$uploadDir' créé avec succès.\n";
    } else {
        echo "Le dossier '$uploadDir' existe déjà.\n";
    }
    
} catch (PDOException $e) {
    die("Erreur PDO : " . $e->getMessage() . "\n");
} catch (Exception $e) {
    die("Erreur : " . $e->getMessage() . "\n");
}
?>
