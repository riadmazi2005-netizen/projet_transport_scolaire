<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

try {
    $pdo = getDBConnection();
    
    // Validate required fields
    if (!isset($data['destinataire_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'destinataire_id est requis']);
        exit;
    }
    
    if (!isset($data['destinataire_type'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'destinataire_type est requis']);
        exit;
    }
    
    if (!isset($data['titre'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'titre est requis']);
        exit;
    }
    
    if (!isset($data['message'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'message est requis']);
        exit;
    }
    
    $stmt = $pdo->prepare('
        INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['destinataire_id'],
        $data['destinataire_type'],
        $data['titre'],
        $data['message'],
        $data['type'] ?? 'info',
        false
    ]);
    
    $id = $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM notifications WHERE id = ?');
    $stmt->execute([$id]);
    $notification = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $notification
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création de la notification: ' . $e->getMessage()]);
}



