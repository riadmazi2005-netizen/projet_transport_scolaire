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
    // tuteur_id n'est requis que pour les demandes de tuteur (inscription, modification, etc.)
    // Pour les demandes de chauffeur/responsable, on utilise demandeur_id
    if (!isset($data['tuteur_id']) && !isset($data['demandeur_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'tuteur_id ou demandeur_id est requis']);
        exit;
    }
    
    if (!isset($data['type_demande'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'type_demande est requis']);
        exit;
    }
    
    // Si c'est une demande de chauffeur/responsable, mapper demandeur_id vers tuteur_id pour compatibilité
    $tuteurId = $data['tuteur_id'] ?? $data['demandeur_id'] ?? null;
    
    // Gérer les différents types de demandes avec leurs champs spécifiques
    // Pour les demandes de chauffeur/responsable (augmentation, congé)
    $description = $data['description'] ?? null;
    
    // Si c'est une demande avec des champs supplémentaires, les inclure dans la description
    if (isset($data['raisons']) || isset($data['salaire_demande']) || isset($data['date_debut_conge'])) {
        $descriptionData = [];
        if (isset($data['raisons'])) $descriptionData['raisons'] = $data['raisons'];
        if (isset($data['salaire_demande'])) $descriptionData['salaire_demande'] = $data['salaire_demande'];
        if (isset($data['salaire_actuel'])) $descriptionData['salaire_actuel'] = $data['salaire_actuel'];
        if (isset($data['date_debut_conge'])) $descriptionData['date_debut_conge'] = $data['date_debut_conge'];
        if (isset($data['date_fin_conge'])) $descriptionData['date_fin_conge'] = $data['date_fin_conge'];
        if (isset($data['nouvelle_adresse'])) $descriptionData['nouvelle_adresse'] = $data['nouvelle_adresse'];
        if (isset($data['nouvelle_zone'])) $descriptionData['nouvelle_zone'] = $data['nouvelle_zone'];
        if (isset($data['date_demenagement'])) $descriptionData['date_demenagement'] = $data['date_demenagement'];
        $description = json_encode($descriptionData);
    }
    
    // Récupérer la zone géographique si fournie
    $zoneGeographique = $data['zone_geographique'] ?? null;
    
    $stmt = $pdo->prepare('
        INSERT INTO demandes (eleve_id, tuteur_id, type_demande, description, zone_geographique, statut)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['eleve_id'] ?? null,
        $tuteurId,
        $data['type_demande'],
        $description,
        $zoneGeographique,
        $data['statut'] ?? 'En attente'
    ]);
    
    $id = $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM demandes WHERE id = ?');
    $stmt->execute([$id]);
    $demande = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $demande
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création de la demande: ' . $e->getMessage()]);
}



