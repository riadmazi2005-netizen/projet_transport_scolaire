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
    
    // Construire la requête UPDATE dynamiquement
    $fields = [];
    $values = [];
    
    foreach ($data as $key => $value) {
        $fields[] = "$key = ?";
        $values[] = $value;
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Aucun champ à mettre à jour']);
        exit;
    }
    
    $values[] = $id;
    $sql = 'UPDATE inscriptions SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    // Récupérer l'inscription mise à jour
    $stmt = $pdo->prepare('SELECT * FROM inscriptions WHERE id = ?');
    $stmt->execute([$id]);
    $inscription = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$inscription) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Inscription non trouvée']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $inscription
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
}



