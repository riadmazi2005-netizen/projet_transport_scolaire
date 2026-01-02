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
    
    $updateFields = [];
    $updateValues = [];
    
    if (isset($data['nom']) && !empty(trim($data['nom']))) {
        $updateFields[] = 'nom = ?';
        $updateValues[] = trim($data['nom']);
    }
    
    if (isset($data['ville']) && !empty(trim($data['ville']))) {
        $updateFields[] = 'ville = ?';
        $updateValues[] = trim($data['ville']);
    }
    
    if (isset($data['description'])) {
        $updateFields[] = 'description = ?';
        $updateValues[] = trim($data['description']);
    }
    
    if (isset($data['actif'])) {
        $updateFields[] = 'actif = ?';
        $updateValues[] = (bool)$data['actif'];
    }
    
    if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Aucune donnée à mettre à jour']);
        exit;
    }
    
    $updateValues[] = $id;
    
    $stmt = $pdo->prepare('UPDATE zones SET ' . implode(', ', $updateFields) . ' WHERE id = ?');
    $stmt->execute($updateValues);
    
    $stmt = $pdo->prepare('SELECT * FROM zones WHERE id = ?');
    $stmt->execute([$id]);
    $zone = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$zone) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Zone non trouvée']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $zone,
        'message' => 'Zone mise à jour avec succès'
    ]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Une zone avec ce nom existe déjà']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
    }
}
?>

