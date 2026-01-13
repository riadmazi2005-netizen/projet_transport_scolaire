<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // 1. Récupérer tous les chauffeurs à supprimer (statut = 'Licencié' ou accidents >= 3)
    // On cible large pour nettoyer
    $stmt = $pdo->query("SELECT id, utilisateur_id FROM chauffeurs WHERE statut = 'Licencié' OR nombre_accidents >= 3");
    $chauffeurs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($chauffeurs)) {
        echo json_encode(['success' => true, 'message' => 'Aucun chauffeur licencié à supprimer']);
        exit;
    }

    $pdo->beginTransaction();
    
    $deletedCount = 0;

    foreach ($chauffeurs as $chauffeur) {
        $chauffeur_id = $chauffeur['id'];
        $utilisateurId = $chauffeur['utilisateur_id'];
        
        // --- Même logique de suppression que licencier.php ---
        
        // 1. Désaffecter le bus
        $stmt = $pdo->prepare('UPDATE bus SET chauffeur_id = NULL WHERE chauffeur_id = ?');
        $stmt->execute([$chauffeur_id]);

        // 2. Supprimer les accidents
        $stmt = $pdo->prepare('DELETE FROM accidents WHERE chauffeur_id = ?');
        $stmt->execute([$chauffeur_id]);
        
        // 3. Supprimer données liées
        $stmt = $pdo->prepare('DELETE FROM prise_essence WHERE chauffeur_id = ?');
        $stmt->execute([$chauffeur_id]);

        $stmt = $pdo->prepare('DELETE FROM signalements WHERE chauffeur_id = ?');
        $stmt->execute([$chauffeur_id]);

        $stmt = $pdo->prepare('DELETE FROM rapports_trajets WHERE chauffeur_id = ?');
        $stmt->execute([$chauffeur_id]);

        $stmt = $pdo->prepare('DELETE FROM checklist_depart WHERE chauffeur_id = ?');
        $stmt->execute([$chauffeur_id]);

        $stmt = $pdo->prepare('UPDATE presences SET chauffeur_id = NULL WHERE chauffeur_id = ?');
        $stmt->execute([$chauffeur_id]);

        // 4. Supprimer le chauffeur
        $stmt = $pdo->prepare('DELETE FROM chauffeurs WHERE id = ?');
        $stmt->execute([$chauffeur_id]);
        
        // 5. Supprimer l'utilisateur et ses dépendances
        if ($utilisateurId) {
            // Demandes
            $stmt = $pdo->prepare('DELETE FROM demandes WHERE tuteur_id = ?');
            $stmt->execute([$utilisateurId]);
            
            // Notifications
            $stmt = $pdo->prepare('DELETE FROM notifications WHERE destinataire_id = ? AND destinataire_type = "chauffeur"');
            $stmt->execute([$utilisateurId]);

            $stmt = $pdo->prepare('DELETE FROM notifications WHERE (destinataire_id = ? OR destinataire_id = ?) AND destinataire_type = "chauffeur"');
            $stmt->execute([$utilisateurId, $chauffeur_id]);
            
            // Utilisateur
            $stmt = $pdo->prepare('DELETE FROM utilisateurs WHERE id = ?');
            $stmt->execute([$utilisateurId]);
        }
        
        $deletedCount++;
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => $deletedCount . ' chauffeur(s) licencié(s) supprimé(s) définitivement'
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur SQL: ' . $e->getMessage()]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
