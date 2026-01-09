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
    
    // Nettoyer les données liées avant suppression pour éviter les erreurs FK
    
    // 1. Désaffecter le bus
    $stmt = $pdo->prepare('UPDATE bus SET chauffeur_id = NULL WHERE chauffeur_id = ?');
    $stmt->execute([$data['id']]);

    // 2. Supprimer les accidents
    $stmt = $pdo->prepare('DELETE FROM accidents WHERE chauffeur_id = ?');
    $stmt->execute([$data['id']]);

    // 3. Supprimer les prises d'essence
    $stmt = $pdo->prepare('DELETE FROM prise_essence WHERE chauffeur_id = ?');
    $stmt->execute([$data['id']]);

    // 4. Supprimer les signalements
    $stmt = $pdo->prepare('DELETE FROM signalements WHERE chauffeur_id = ?');
    $stmt->execute([$data['id']]);

    // 5. Supprimer les rapports
    $stmt = $pdo->prepare('DELETE FROM rapports_trajets WHERE chauffeur_id = ?');
    $stmt->execute([$data['id']]);

    // 6. Supprimer les checklists
    $stmt = $pdo->prepare('DELETE FROM checklist_depart WHERE chauffeur_id = ?');
    $stmt->execute([$data['id']]);

    // 7. Mettre à jour les présences (nullifier chauffeur_id)
    $stmt = $pdo->prepare('UPDATE presences SET chauffeur_id = NULL WHERE chauffeur_id = ?');
    $stmt->execute([$data['id']]);

    // Supprimer le chauffeur
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









