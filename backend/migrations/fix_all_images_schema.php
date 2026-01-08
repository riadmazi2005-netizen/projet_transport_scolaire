<?php
/**
 * Migration: Changer les colonnes photos en LONGTEXT pour éviter la troncature
 * 
 * Affecte:
 * - prise_essence.photo_ticket
 * - accidents.photos
 */

require_once '../config/database.php';

try {
    $pdo = getDBConnection();
    
    echo "<h2>Migration des colonnes photos vers LONGTEXT</h2>";
    
    // 1. Table prise_essence
    echo "<h3>1. Table prise_essence</h3>";
    $stmt = $pdo->query("SHOW COLUMNS FROM prise_essence WHERE Field = 'photo_ticket'");
    $column = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($column) {
        $currentType = $column['Type'];
        echo "<p>Type actuel photo_ticket: <strong>$currentType</strong></p>";
        
        if (strpos($currentType, 'longtext') === false) {
            echo "<p>Migration en cours pour prise_essence...</p>";
            $pdo->exec("ALTER TABLE prise_essence MODIFY COLUMN photo_ticket LONGTEXT");
            echo "<p style='color: green;'>✅ prise_essence.photo_ticket migré vers LONGTEXT</p>";
        } else {
            echo "<p style='color: blue;'>ℹ️ Déjà en LONGTEXT</p>";
        }
    } else {
        echo "<p style='color: orange;'>⚠️ Colonne photo_ticket non trouvée</p>";
    }
    
    // 2. Table accidents
    echo "<h3>2. Table accidents</h3>";
    $stmt = $pdo->query("SHOW COLUMNS FROM accidents WHERE Field = 'photos'");
    $column = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($column) {
        $currentType = $column['Type'];
        echo "<p>Type actuel photos: <strong>$currentType</strong></p>";
        
        if (strpos($currentType, 'longtext') === false) {
            echo "<p>Migration en cours pour accidents...</p>";
            $pdo->exec("ALTER TABLE accidents MODIFY COLUMN photos LONGTEXT");
            echo "<p style='color: green;'>✅ accidents.photos migré vers LONGTEXT</p>";
        } else {
            echo "<p style='color: blue;'>ℹ️ Déjà en LONGTEXT</p>";
        }
    } else {
        echo "<p style='color: orange;'>⚠️ Colonne photos non trouvée</p>";
    }
    
    // 3. Table signalements (mentionné dans ChauffeurDashboard)
    echo "<h3>3. Table signalements</h3>";
    $stmt = $pdo->query("SHOW COLUMNS FROM signalements WHERE Field = 'photos'");
    $column = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($column) {
        $currentType = $column['Type'];
        echo "<p>Type actuel photos: <strong>$currentType</strong></p>";
        
        if (strpos($currentType, 'longtext') === false) {
            echo "<p>Migration en cours pour signalements...</p>";
            $pdo->exec("ALTER TABLE signalements MODIFY COLUMN photos LONGTEXT");
            echo "<p style='color: green;'>✅ signalements.photos migré vers LONGTEXT</p>";
        } else {
            echo "<p style='color: blue;'>ℹ️ Déjà en LONGTEXT</p>";
        }
    } else {
        echo "<p style='color: orange;'>⚠️ Colonne photos non trouvée dans signalements</p>";
    }

    echo "<h2>Résumé</h2>";
    echo "<p style='color: green;'><strong>Migration terminée avec succès!</strong></p>";
    
} catch (PDOException $e) {
    http_response_code(500);
    echo "<h2 style='color: red;'>Erreur critique</h2>";
    echo "<p style='color: red;'>" . $e->getMessage() . "</p>";
}
?>
