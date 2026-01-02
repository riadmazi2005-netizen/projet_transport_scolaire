<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['nom']) || empty(trim($data['nom']))) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Le nom de la zone est requis']);
    exit;
}

if (!isset($data['ville']) || empty(trim($data['ville']))) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La ville est requise']);
    exit;
}

try {
    $pdo = getDBConnection();
    $nom = trim($data['nom']);
    $ville = trim($data['ville']);
    $description = isset($data['description']) ? trim($data['description']) : null;
    $actif = isset($data['actif']) ? (bool)$data['actif'] : true;
    
    $stmt = $pdo->prepare('INSERT INTO zones (nom, ville, description, actif) VALUES (?, ?, ?, ?)');
    $stmt->execute([$nom, $ville, $description, $actif]);
    
    $id = $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM zones WHERE id = ?');
    $stmt->execute([$id]);
    $zone = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $zone,
        'message' => 'Zone créée avec succès'
    ]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) { // Duplicate entry
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Une zone avec ce nom existe déjà']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la création: ' . $e->getMessage()]);
    }
}
?>

