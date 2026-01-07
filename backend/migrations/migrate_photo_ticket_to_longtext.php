<?php
/**
 * Migration: Changer photo_ticket de VARCHAR(255) à LONGTEXT
 * 
 * Exécuter ce script une seule fois pour migrer la colonne photo_ticket
 * de la table prise_essence de VARCHAR(255) à LONGTEXT
 * 
 * URL: http://localhost/backend/migrations/migrate_photo_ticket_to_longtext.php
 */

require_once '../config/database.php';

try {
    $pdo = getDBConnection();
    
    // Vérifier la structure actuelle
    $stmt = $pdo->query("SHOW COLUMNS FROM prise_essence WHERE Field = 'photo_ticket'");
    $column = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$column) {
        die(json_encode(['success' => false, 'message' => 'Colonne photo_ticket introuvable']));
    }
    
    $currentType = $column['Type'];
    
    echo "<h2>Migration de la colonne photo_ticket</h2>";
    echo "<p>Type actuel: <strong>$currentType</strong></p>";
    
    if (strpos($currentType, 'longtext') !== false || strpos($currentType, 'text') !== false) {
        echo "<p style='color: green;'>✅ La colonne est déjà en LONGTEXT. Aucune migration nécessaire.</p>";
        exit;
    }
    
    // Effectuer la migration
    echo "<p>Migration en cours...</p>";
    
    $pdo->exec("ALTER TABLE prise_essence MODIFY COLUMN photo_ticket LONGTEXT");
    
    // Vérifier le nouveau type
    $stmt = $pdo->query("SHOW COLUMNS FROM prise_essence WHERE Field = 'photo_ticket'");
    $newColumn = $stmt->fetch(PDO::FETCH_ASSOC);
    $newType = $newColumn['Type'];
    
    echo "<p style='color: green;'>✅ Migration réussie!</p>";
    echo "<p>Nouveau type: <strong>$newType</strong></p>";
    echo "<p>Vous pouvez maintenant enregistrer des photos complètes sans troncature.</p>";
    
    echo json_encode([
        'success' => true,
        'message' => 'Migration réussie',
        'old_type' => $currentType,
        'new_type' => $newType
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo "<p style='color: red;'>❌ Erreur: " . $e->getMessage() . "</p>";
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>

