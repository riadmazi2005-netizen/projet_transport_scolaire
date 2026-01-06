<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Récupérer le tuteur_id depuis les paramètres de requête
$tuteurId = isset($_GET['tuteur_id']) ? intval($_GET['tuteur_id']) : null;

if (!$tuteurId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'tuteur_id est requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Récupérer tous les paiements du tuteur avec les informations des élèves
    $stmt = $pdo->prepare('
        SELECT 
            p.*,
            e.nom as eleve_nom,
            e.prenom as eleve_prenom,
            e.classe as eleve_classe,
            d.id as demande_id,
            d.statut as demande_statut
        FROM paiements p
        LEFT JOIN eleves e ON p.eleve_id = e.id
        LEFT JOIN demandes d ON p.demande_id = d.id
        WHERE e.tuteur_id = ?
        ORDER BY p.date_paiement DESC
    ');
    $stmt->execute([$tuteurId]);
    $paiements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $paiements
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des paiements: ' . $e->getMessage()
    ]);
}
?>

