<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$eleveId = isset($_GET['eleve_id']) ? intval($_GET['eleve_id']) : null;

if (!$eleveId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'eleve_id est requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Récupérer toutes les inscriptions de l'élève
    $stmt = $pdo->prepare('
        SELECT 
            i.*,
            b.numero as bus_numero,
            b.marque as bus_marque,
            b.modele as bus_modele,
            b.capacite as bus_capacite,
            t.nom as trajet_nom
        FROM inscriptions i
        LEFT JOIN bus b ON i.bus_id = b.id
        LEFT JOIN trajets t ON b.trajet_id = t.id
        WHERE i.eleve_id = ?
        ORDER BY i.date_creation DESC
    ');
    $stmt->execute([$eleveId]);
    $inscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $inscriptions
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des inscriptions: ' . $e->getMessage()
    ]);
}
?>

