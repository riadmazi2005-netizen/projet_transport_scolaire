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
    echo json_encode(['success' => false, 'message' => 'ID requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Récupérer l'utilisateur_id avant la suppression
    $stmt = $pdo->prepare('SELECT utilisateur_id FROM chauffeurs WHERE id = ?');
    $stmt->execute([$data['id']]);
    $chauffeur = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$chauffeur) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Chauffeur non trouvé']);
        exit;
    }
    
    // Supprimer le chauffeur (cela supprimera aussi l'utilisateur grâce à ON DELETE CASCADE si configuré dans l'autre sens)
    // Mais pour être sûr, on supprime d'abord le chauffeur, puis l'utilisateur
    $stmt = $pdo->prepare('DELETE FROM chauffeurs WHERE id = ?');
    $stmt->execute([$data['id']]);
    
    // Supprimer l'utilisateur associé (si la cascade ne le fait pas automatiquement)
    if ($chauffeur['utilisateur_id']) {
        $stmt = $pdo->prepare('DELETE FROM utilisateurs WHERE id = ?');
        $stmt->execute([$chauffeur['utilisateur_id']]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Chauffeur supprimé'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
}









