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
    echo json_encode(['success' => false, 'message' => 'ID de la demande requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier que la demande existe et n'est pas encore traitée
    $stmt = $pdo->prepare('SELECT * FROM demandes WHERE id = ?');
    $stmt->execute([$data['id']]);
    $demande = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$demande) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Demande non trouvée']);
        exit;
    }
    
    // Préparer les champs à mettre à jour
    $fields = [];
    $values = [];
    
    // Champs autorisés pour la mise à jour
    $allowedFields = ['description', 'zone_geographique', 'type_demande'];
    
    // Permettre la modification si la demande est "En attente" ou "En cours de traitement"
    $canUpdateAll = ($demande['statut'] === 'En attente' || $demande['statut'] === 'En cours de traitement');
    
    foreach ($data as $key => $value) {
        // Si la demande n'est pas "En attente" ou "En cours de traitement", on ne permet que la modification de zone_geographique
        if (!$canUpdateAll && $key !== 'zone_geographique') {
            continue;
        }
        
        if (in_array($key, $allowedFields) && $key !== 'id') {
            // Si c'est la description et qu'elle contient des données supplémentaires, les encoder en JSON
            if ($key === 'description' && is_array($value)) {
                $fields[] = "$key = ?";
                $values[] = json_encode($value);
            } else {
                $fields[] = "$key = ?";
                $values[] = $value;
            }
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Aucune donnée à mettre à jour']);
        exit;
    }
    
    $values[] = $data['id'];
    
    // Mettre à jour la demande
    $sql = "UPDATE demandes SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    // Récupérer la demande mise à jour
    $stmt = $pdo->prepare('SELECT * FROM demandes WHERE id = ?');
    $stmt->execute([$data['id']]);
    $updatedDemande = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Parser la description JSON
    if ($updatedDemande['description']) {
        $desc = json_decode($updatedDemande['description'], true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($desc)) {
            foreach ($desc as $key => $value) {
                if (!isset($updatedDemande[$key])) {
                    $updatedDemande[$key] = $value;
                }
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $updatedDemande,
        'message' => 'Demande mise à jour avec succès'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
}



