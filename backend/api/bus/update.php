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
    $id = $data['id'];
    unset($data['id']);
    
    // Vérifier si le chauffeur est déjà affecté à un autre bus
    if (isset($data['chauffeur_id']) && !empty($data['chauffeur_id'])) {
        $stmt = $pdo->prepare('SELECT id FROM bus WHERE chauffeur_id = ? AND id != ?');
        $stmt->execute([$data['chauffeur_id'], $id]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ce chauffeur est déjà affecté à un autre bus']);
            exit;
        }
    }
    
    // Vérifier si le responsable est déjà affecté à un autre bus
    if (isset($data['responsable_id']) && !empty($data['responsable_id'])) {
        $stmt = $pdo->prepare('SELECT id FROM bus WHERE responsable_id = ? AND id != ?');
        $stmt->execute([$data['responsable_id'], $id]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ce responsable est déjà affecté à un autre bus']);
            exit;
        }
    }
    
    $fields = [];
    $values = [];
    foreach ($data as $key => $value) {
        $fields[] = "$key = ?";
        $values[] = $value;
    }
    $values[] = $id;
    
    $sql = "UPDATE bus SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    $stmt = $pdo->prepare('SELECT * FROM bus WHERE id = ?');
    $stmt->execute([$id]);
    $bus = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $bus
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
}
?>







