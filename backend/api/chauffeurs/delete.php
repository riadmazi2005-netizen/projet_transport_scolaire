<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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
    
    // Récupérer l'utilisateur_id avant la suppression
    $stmt = $pdo->prepare('SELECT utilisateur_id FROM chauffeurs WHERE id = ?');
    $stmt->execute([$data['id']]);
    $chauffeur = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$chauffeur) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Chauffeur non trouvé']);
        exit;
    }
    
    $utilisateurId = $chauffeur['utilisateur_id'];
    $chauffeurId = $data['id'];

    $pdo->beginTransaction();

    // 1. Désaffecter le bus
    $stmt = $pdo->prepare('UPDATE bus SET chauffeur_id = NULL WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeurId]);

    // 2. Supprimer les accidents
    $stmt = $pdo->prepare('DELETE FROM accidents WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeurId]);

    // 3. Supprimer les prises d'essence
    $stmt = $pdo->prepare('DELETE FROM prise_essence WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeurId]);

    // 4. Supprimer les signalements
    $stmt = $pdo->prepare('DELETE FROM signalements_maintenance WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeurId]);

    // 5. Supprimer les rapports
    $stmt = $pdo->prepare('DELETE FROM rapports_trajet WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeurId]);

    // 6. Supprimer les checklists
    $stmt = $pdo->prepare('DELETE FROM checklist_depart WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeurId]);

    // 7. Mettre à jour les présences (nullifier chauffeur_id)
    $stmt = $pdo->prepare('UPDATE presences SET chauffeur_id = NULL WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeurId]);

    // 8. Supprimer le chauffeur
    $stmt = $pdo->prepare('DELETE FROM chauffeurs WHERE id = ?');
    $stmt->execute([$chauffeurId]);
    
    // 9. Supprimer les dépendances utilisateur (Demandes & Notifications)
    if ($utilisateurId) {
        // Demandes (Source de l'erreur FK précédente)
        $stmt = $pdo->prepare('DELETE FROM demandes WHERE tuteur_id = ?');
        $stmt->execute([$utilisateurId]);
        
        // Notifications
        $stmt = $pdo->prepare('DELETE FROM notifications WHERE destinataire_id = ? AND destinataire_type = "chauffeur"');
        $stmt->execute([$utilisateurId]);
        
        // Notifications où il est notifié explicitement (avec chauffeur_id) ou via user_id
        $stmt = $pdo->prepare('DELETE FROM notifications WHERE (destinataire_id = ? OR destinataire_id = ?) AND destinataire_type = "chauffeur"');
        $stmt->execute([$utilisateurId, $chauffeurId]);

        // Supprimer l'utilisateur
        $stmt = $pdo->prepare('DELETE FROM utilisateurs WHERE id = ?');
        $stmt->execute([$utilisateurId]);
    }
    
    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Chauffeur supprimé avec succès'
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
