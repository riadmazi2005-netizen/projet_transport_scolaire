<?php
/**
 * Script pour corriger les classes des élèves
 * Remplace les classes C3E... par des classes valides selon le niveau
 */

require_once 'config/database.php';

// Mapping des classes C3E vers les classes valides
// On suppose que C3E correspond à 3ème année collège (3AC)
$classMapping = [
    'C3E' => '3AC',
    'C3E1' => '3AC',
    'C3E2' => '3AC',
    'C3E3' => '3AC',
    // Ajoutez d'autres mappings si nécessaire
];

// Classes valides par niveau
$validClasses = [
    'Primaire' => ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP'],
    'Collège' => ['1AC', '2AC', '3AC'],
    'Lycée' => ['TC', '1BAC', '2BAC']
];

try {
    $pdo = getDBConnection();
    
    // Récupérer tous les élèves avec des classes invalides (commençant par C3E ou autres classes invalides)
    $stmt = $pdo->query("SELECT id, classe FROM eleves WHERE classe LIKE 'C3E%' OR classe NOT IN ('1AP', '2AP', '3AP', '4AP', '5AP', '6AP', '1AC', '2AC', '3AC', 'TC', '1BAC', '2BAC')");
    $eleves = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $updated = 0;
    $errors = [];
    
    foreach ($eleves as $eleve) {
        $oldClass = $eleve['classe'];
        $newClass = null;
        
        // Si la classe est dans le mapping, utiliser le mapping
        if (isset($classMapping[$oldClass])) {
            $newClass = $classMapping[$oldClass];
        } else {
            // Sinon, essayer de deviner selon le pattern
            // C3E -> 3AC (3ème année collège)
            if (preg_match('/^C3E/i', $oldClass)) {
                $newClass = '3AC';
            }
            // C2E -> 2AC
            elseif (preg_match('/^C2E/i', $oldClass)) {
                $newClass = '2AC';
            }
            // C1E -> 1AC
            elseif (preg_match('/^C1E/i', $oldClass)) {
                $newClass = '1AC';
            }
            // Si on ne peut pas déterminer, mettre une classe par défaut (3AC)
            else {
                $newClass = '3AC'; // Par défaut
            }
        }
        
        // Mettre à jour la classe
        try {
            $updateStmt = $pdo->prepare("UPDATE eleves SET classe = ? WHERE id = ?");
            $updateStmt->execute([$newClass, $eleve['id']]);
            $updated++;
            echo "✓ Élève ID {$eleve['id']}: {$oldClass} → {$newClass}\n";
        } catch (PDOException $e) {
            $errors[] = "Erreur pour l'élève ID {$eleve['id']}: " . $e->getMessage();
            echo "✗ Erreur pour l'élève ID {$eleve['id']}: {$e->getMessage()}\n";
        }
    }
    
    echo "\n=== Résumé ===\n";
    echo "Élèves mis à jour: {$updated}\n";
    echo "Erreurs: " . count($errors) . "\n";
    
    if (count($errors) > 0) {
        echo "\n=== Erreurs ===\n";
        foreach ($errors as $error) {
            echo "- {$error}\n";
        }
    }
    
} catch (PDOException $e) {
    echo "Erreur de connexion à la base de données: " . $e->getMessage() . "\n";
    exit(1);
}
?>

