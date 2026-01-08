<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$bus_id = $_GET['bus_id'] ?? null;
if (!$bus_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'bus_id requis']);
    exit;
}

$pdo = getDBConnection();
$stmt = $pdo->prepare('
    SELECT 
        e.*,
        i.id as inscription_id
    FROM eleves e
    JOIN inscriptions i ON e.id = i.eleve_id
    WHERE i.bus_id = ? AND i.statut = "Active"
');
$stmt->execute([$bus_id]);
$eleves = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Récupérer le groupe depuis la demande pour chaque élève
foreach ($eleves as &$eleve) {
    // Chercher la demande d'inscription pour cet élève
    $stmtDemande = $pdo->prepare('
        SELECT description 
        FROM demandes 
        WHERE eleve_id = ? AND type_demande = "inscription" 
        ORDER BY date_creation DESC 
        LIMIT 1
    ');
    $stmtDemande->execute([$eleve['id']]);
    $demande = $stmtDemande->fetch(PDO::FETCH_ASSOC);
    
    // Extraire le groupe de la description JSON
    $groupe = 'A'; // Valeur par défaut
    if ($demande && $demande['description']) {
        $descriptionData = json_decode($demande['description'], true);
        if (isset($descriptionData['groupe'])) {
            $groupe = $descriptionData['groupe'];
        }
    }
    $eleve['groupe'] = $groupe;
}

echo json_encode([
    'success' => true,
    'data' => $eleves
]);









