<?php
require_once '../../config/database.php';

try {
    $pdo = getDBConnection();
    
    // Check columns
    $columns = ['responsable_id', 'photos', 'eleves_concernees', 'statut'];
    $existing = [];
    
    $stmt = $pdo->query("SHOW COLUMNS FROM accidents");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $existing[] = $row['Field'];
    }
    
    echo "Existing columns: " . implode(', ', $existing) . "\n";
    
    $updates = [];
    
    if (!in_array('responsable_id', $existing)) {
        $pdo->exec("ALTER TABLE accidents ADD COLUMN responsable_id INT NULL");
        $updates[] = "Added responsable_id";
    }
    
    if (!in_array('photos', $existing)) {
        $pdo->exec("ALTER TABLE accidents ADD COLUMN photos TEXT NULL");
        $updates[] = "Added photos";
    }
    
    if (!in_array('eleves_concernees', $existing)) {
        $pdo->exec("ALTER TABLE accidents ADD COLUMN eleves_concernees TEXT NULL");
        $updates[] = "Added eleves_concernees";
    }
    
    if (!in_array('statut', $existing)) {
        $pdo->exec("ALTER TABLE accidents ADD COLUMN statut VARCHAR(50) DEFAULT 'En attente'");
        $updates[] = "Added statut";
    }

    if (empty($updates)) {
        echo "Schema is up to date.\n";
    } else {
        echo "Updates applied: \n" . implode("\n", $updates) . "\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
