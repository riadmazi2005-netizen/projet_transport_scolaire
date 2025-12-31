<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id']) || !isset($data['statut'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID et statut requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Mettre à jour la demande
    $stmt = $pdo->prepare('
        UPDATE demandes 
        SET statut = ?, 
            date_traitement = NOW(),
            traite_par = ?
        WHERE id = ?
    ');
    
    $stmt->execute([
        $data['statut'],
        $data['traite_par'] ?? null,
        $data['id']
    ]);
    
    // Récupérer la demande mise à jour
    $stmt = $pdo->prepare('SELECT * FROM demandes WHERE id = ?');
    $stmt->execute([$data['id']]);
    $demande = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $demande,
        'message' => 'Demande traitée avec succès'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du traitement: ' . $e->getMessage()]);
}
?>

