<?php
require_once 'config/database.php';

try {
    $pdo = getDBConnection();
    
    // Vérifier le type actuel
    $stmt = $pdo->query("SHOW COLUMNS FROM prise_essence WHERE Field = 'photo_ticket'");
    $column = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($column) {
        echo "Type actuel: " . $column['Type'] . "\n";
        
        if (strpos($column['Type'], 'varchar') !== false || strpos($column['Type'], 'VARCHAR') !== false) {
            echo "Migration nécessaire: changement de VARCHAR en LONGTEXT...\n";
            
            // Exécuter la migration
            $pdo->exec("ALTER TABLE prise_essence MODIFY COLUMN photo_ticket LONGTEXT NULL");
            
            echo "✅ Migration réussie! La colonne est maintenant en LONGTEXT.\n";
        } else {
            echo "✅ La colonne est déjà en TEXT/LONGTEXT, pas besoin de migration.\n";
        }
    }
    
} catch (PDOException $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
?>
