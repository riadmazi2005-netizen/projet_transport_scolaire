<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de la prise d\'essence requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier que la prise d'essence existe
    $stmt = $pdo->prepare('SELECT * FROM prise_essence WHERE id = ?');
    $stmt->execute([$data['id']]);
    $prise = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$prise) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Prise d\'essence non trouvée']);
        exit;
    }
    
    // Supprimer la prise d'essence
    $stmt = $pdo->prepare('DELETE FROM prise_essence WHERE id = ?');
    $stmt->execute([$data['id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Prise d\'essence supprimée avec succès'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}


