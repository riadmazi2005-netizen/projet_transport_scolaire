<?php
// Script temporaire pour exécuter la migration depuis le dossier root backend
require_once 'config/headers.php';
require_once 'config/database.php';

echo "<h2>Démarrage de la migration...</h2>";

try {
    $pdo = getDBConnection();
    
    // 1. Ajouter column photo_identite
    echo "Vérification de la colonne photo_identite...<br>";
    $stmt = $pdo->query("SHOW COLUMNS FROM tuteurs LIKE 'photo_identite'");
    $exists = $stmt->fetch();
    
    if (!$exists) {
        $sql = "ALTER TABLE tuteurs ADD COLUMN photo_identite VARCHAR(255) NULL AFTER adresse";
        $pdo->exec($sql);
        echo "✅ Colonne 'photo_identite' ajoutée.<br>";
    } else {
        echo "ℹ️ La colonne 'photo_identite' existe déjà.<br>";
    }
    
    // 2. Créer dossier upload
    $uploadDir = 'uploads/tuteurs';
    echo "Vérification du dossier $uploadDir...<br>";
    
    if (!file_exists($uploadDir)) {
        if (mkdir($uploadDir, 0777, true)) {
             echo "✅ Dossier '$uploadDir' créé.<br>";
        } else {
             echo "❌ Echec création dossier '$uploadDir'. Vérifiez les permissions.<br>";
        }
    } else {
        echo "ℹ️ Le dossier existe déjà.<br>";
    }
    
    echo "<h3>Migration terminée.</h3>";
    
} catch (Exception $e) {
    echo "❌ Erreur : " . $e->getMessage();
}
?>
