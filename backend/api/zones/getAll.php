<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

try {
    $pdo = getDBConnection();
    $ville = isset($_GET['ville']) ? trim($_GET['ville']) : null;
    
    if ($ville) {
        // Filtrer par ville (pour l'API publique, retourner seulement les actives)
        $stmt = $pdo->prepare('SELECT * FROM zones WHERE ville = ? AND actif = 1 ORDER BY nom ASC');
        $stmt->execute([$ville]);
    } else {
        // Récupérer toutes les zones actives (pour l'inscription, on veut seulement les actives)
        $stmt = $pdo->prepare('SELECT * FROM zones WHERE actif = 1 ORDER BY ville ASC, nom ASC');
        $stmt->execute();
    }
    $zones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $zones
    ]);
} catch (PDOException $e) {
    // Vérifier si les headers ont déjà été envoyés
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json');
    }
    
    // Vérifier si c'est une erreur de connexion
    $message = $e->getMessage();
    if (strpos($message, '2002') !== false || strpos($message, 'connexion') !== false) {
        $message = 'Erreur de connexion à la base de données. Vérifiez que MySQL est démarré dans XAMPP et que le port est correct (3306 ou 3307).';
    }
    
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des zones: ' . $message
    ]);
    exit; // Arrêter l'exécution pour éviter d'autres sorties
}
?>

