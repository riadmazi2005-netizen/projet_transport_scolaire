<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validation des champs requis
if (!isset($data['eleve_id']) || empty($data['eleve_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de l\'élève requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier que l'élève existe
    $stmt = $pdo->prepare('SELECT id FROM eleves WHERE id = ?');
    $stmt->execute([$data['eleve_id']]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Élève non trouvé']);
        exit;
    }
    
    // Vérifier si le bus existe (si fourni)
    if (isset($data['bus_id']) && !empty($data['bus_id'])) {
        $stmt = $pdo->prepare('SELECT id FROM bus WHERE id = ?');
        $stmt->execute([$data['bus_id']]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Bus non trouvé']);
            exit;
        }
    }
    
    // Préparer les valeurs pour l'insertion
    $dateInscription = isset($data['date_inscription']) ? $data['date_inscription'] : date('Y-m-d');
    $dateDebut = isset($data['date_debut']) ? $data['date_debut'] : null;
    $dateFin = isset($data['date_fin']) ? $data['date_fin'] : null;
    $statut = isset($data['statut']) ? $data['statut'] : 'Active';
    $montantMensuel = isset($data['montant_mensuel']) ? $data['montant_mensuel'] : null;
    $busId = isset($data['bus_id']) && !empty($data['bus_id']) ? $data['bus_id'] : null;
    
    // Insérer l'inscription
    $stmt = $pdo->prepare('
        INSERT INTO inscriptions (eleve_id, bus_id, date_inscription, date_debut, date_fin, statut, montant_mensuel)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['eleve_id'],
        $busId,
        $dateInscription,
        $dateDebut,
        $dateFin,
        $statut,
        $montantMensuel
    ]);
    
    $inscriptionId = $pdo->lastInsertId();
    
    // Récupérer l'inscription créée
    $stmt = $pdo->prepare('SELECT * FROM inscriptions WHERE id = ?');
    $stmt->execute([$inscriptionId]);
    $inscription = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $inscription,
        'message' => 'Inscription créée avec succès'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création: ' . $e->getMessage()]);
}
?>

