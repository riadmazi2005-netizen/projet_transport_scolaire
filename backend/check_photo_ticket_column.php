<?php
require_once 'config/database.php';

try {
    $pdo = getDBConnection();
    
    // Vérifier le type de colonne
    $stmt = $pdo->query("SHOW COLUMNS FROM prise_essence WHERE Field = 'photo_ticket'");
    $column = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($column) {
        echo "Type actuel de photo_ticket: " . $column['Type'] . "\n";
        echo "Null: " . $column['Null'] . "\n";
        
        if (strpos($column['Type'], 'varchar') !== false || strpos($column['Type'], 'VARCHAR') !== false) {
            echo "\n⚠️ ATTENTION: La colonne est VARCHAR, ce qui est trop petit pour les images base64!\n";
            echo "Vous devez exécuter la migration pour changer en LONGTEXT.\n";
        } else if (strpos($column['Type'], 'text') !== false || strpos($column['Type'], 'TEXT') !== false) {
            echo "\n✅ La colonne est en TEXT/LONGTEXT, c'est bon!\n";
        }
    } else {
        echo "Colonne photo_ticket non trouvée!\n";
    }
    
    // Vérifier une prise d'essence avec photo
    $stmt = $pdo->query("SELECT id, LENGTH(photo_ticket) as photo_length, LEFT(photo_ticket, 100) as photo_preview FROM prise_essence WHERE photo_ticket IS NOT NULL AND photo_ticket != '' LIMIT 1");
    $prise = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($prise) {
        echo "\nExemple de photo:\n";
        echo "ID: " . $prise['id'] . "\n";
        echo "Longueur: " . $prise['photo_length'] . " caractères\n";
        echo "Preview (100 premiers caractères): " . $prise['photo_preview'] . "\n";
        
        if ($prise['photo_length'] == 255) {
            echo "\n⚠️ ATTENTION: La photo fait exactement 255 caractères, elle a probablement été tronquée!\n";
        }
    } else {
        echo "\nAucune prise d'essence avec photo trouvée.\n";
    }
    
} catch (PDOException $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
?>

