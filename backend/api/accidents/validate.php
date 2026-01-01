<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Mettre à jour le statut à "Validé"
    $stmt = $pdo->prepare('UPDATE accidents SET statut = ? WHERE id = ?');
    $stmt->execute(['Validé', $data['id']]);
    
    // Récupérer l'accident mis à jour
    $stmt = $pdo->prepare('SELECT * FROM accidents WHERE id = ?');
    $stmt->execute([$data['id']]);
    $accident = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Décoder les photos si présentes
    if ($accident['photos']) {
        $accident['photos'] = json_decode($accident['photos'], true);
    }
    
    // Décoder les élèves concernés si présents
    if ($accident['eleves_concernees']) {
        $accident['eleves_concernees'] = json_decode($accident['eleves_concernees'], true);
    }
    
    echo json_encode([
        'success' => true,
        'data' => $accident,
        'message' => 'Rapport validé avec succès'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la validation: ' . $e->getMessage()]);
}
?>

