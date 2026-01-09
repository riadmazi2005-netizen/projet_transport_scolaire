<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$userId = isset($data['user_id']) ? intval($data['user_id']) : null;
$userType = isset($data['user_type']) ? trim($data['user_type']) : null;

if (!$userId || !$userType) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id et user_type sont requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Si le type est 'tuteur', on veut supprimer les notifications pour le tuteur_id et l'utilisateur_id
    $idsToCheck = [$userId];
    
    if ($userType === 'tuteur') {
        // Vérifier si l'ID fourni est un ID tuteur
        $stmt = $pdo->prepare('SELECT id, utilisateur_id FROM tuteurs WHERE id = ?');
        $stmt->execute([$userId]);
        $tuteur = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($tuteur && $tuteur['utilisateur_id']) {
            if (!in_array($tuteur['utilisateur_id'], $idsToCheck)) {
                $idsToCheck[] = $tuteur['utilisateur_id'];
            }
        } else {
            // Vérifier si c'est un ID utilisateur
            $stmt = $pdo->prepare('SELECT id, utilisateur_id FROM tuteurs WHERE utilisateur_id = ?');
            $stmt->execute([$userId]);
            $tuteur = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($tuteur) {
                if (!in_array($tuteur['id'], $idsToCheck)) {
                    $idsToCheck[] = $tuteur['id'];
                }
            }
        }
    }
    
    $placeholders = implode(',', array_fill(0, count($idsToCheck), '?'));
    $sql = "DELETE FROM notifications WHERE destinataire_type = ? AND destinataire_id IN ($placeholders)";
    
    $params = array_merge([$userType], $idsToCheck);
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $deletedCount = $stmt->rowCount();
    
    echo json_encode([
        'success' => true,
        'message' => "{$deletedCount} notification(s) supprimée(s)",
        'deleted_count' => $deletedCount
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
}



