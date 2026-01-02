<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

try {
    $pdo = getDBConnection();
    $ville = isset($_GET['ville']) ? trim($_GET['ville']) : null;
    
    if ($ville) {
        // Filtrer par ville (pour l'API publique, retourner seulement les actives)
        $stmt = $pdo->prepare('SELECT * FROM zones WHERE ville = ? ORDER BY nom ASC');
        $stmt->execute([$ville]);
    } else {
        // Récupérer toutes les zones (pour la gestion admin, on veut voir toutes les zones)
        $stmt = $pdo->prepare('SELECT * FROM zones ORDER BY ville ASC, nom ASC');
        $stmt->execute();
    }
    $zones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $zones
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des zones: ' . $e->getMessage()
    ]);
}
?>

