<?php
require_once 'backend/config/database.php';

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("SELECT * FROM presences WHERE eleve_id = 32");
    $stmt->execute();
    $presences = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Count: " . count($presences) . "\n";
    print_r($presences);
    
    // Also check current date
    echo "Current Date: " . date('Y-m-d') . "\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
