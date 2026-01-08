<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
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
    
    $updateFields = [];
    $updateValues = [];
    
    if (isset($data['statut'])) {
        $updateFields[] = 'statut = ?';
        $updateValues[] = $data['statut'];
    }
    
    if (isset($data['description'])) {
        $updateFields[] = 'description = ?';
        $updateValues[] = $data['description'];
    }
    
    if (isset($data['urgence'])) {
        $updateFields[] = 'urgence = ?';
        $updateValues[] = $data['urgence'];
    }
    
    if (isset($data['date_resolution'])) {
        $updateFields[] = 'date_resolution = ?';
        $updateValues[] = $data['date_resolution'];
    } else if (isset($data['statut']) && $data['statut'] === 'resolu') {
        $updateFields[] = 'date_resolution = NOW()';
    }
    
    if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Aucun champ à mettre à jour']);
        exit;
    }
    
    $updateValues[] = $data['id'];
    
    $sql = 'UPDATE signalements_maintenance SET ' . implode(', ', $updateFields) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($updateValues);
    
    $stmt = $pdo->prepare('SELECT * FROM signalements_maintenance WHERE id = ?');
    $stmt->execute([$data['id']]);
    $signalement = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $signalement
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}



