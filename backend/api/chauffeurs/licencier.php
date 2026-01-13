<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['chauffeur_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID chauffeur requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    $pdo->beginTransaction();
    
    $chauffeur_id = (int)$data['chauffeur_id'];
    
    // Récupérer les informations du chauffeur avant suppression pour la notification
    $stmt = $pdo->prepare('
        SELECT c.id, c.utilisateur_id, b.id as bus_id, u.nom, u.prenom, b.responsable_id, b.numero as bus_numero
        FROM chauffeurs c
        INNER JOIN utilisateurs u ON c.utilisateur_id = u.id
        LEFT JOIN bus b ON c.id = b.chauffeur_id
        WHERE c.id = ?
    ');
    $stmt->execute([$chauffeur_id]);
    $chauffeurData = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$chauffeurData) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Chauffeur non trouvé']);
        exit;
    }
    
    $chauffeurNom = $chauffeurData['prenom'] . ' ' . $chauffeurData['nom'];
    $busId = $chauffeurData['bus_id'];
    $responsableId = $chauffeurData['responsable_id'];
    $busNumero = $chauffeurData['bus_numero'] || 'Inconnu';
    $utilisateurId = $chauffeurData['utilisateur_id'];
    
    // 1. Désaffecter le bus (retirer le chauffeur_id)
    if ($busId) {
        $stmt = $pdo->prepare('UPDATE bus SET chauffeur_id = NULL WHERE id = ?');
        $stmt->execute([$busId]);
    }

    // 2. Supprimer les accidents liés à ce chauffeur
    $stmt = $pdo->prepare('DELETE FROM accidents WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeur_id]);
    
    // 3. Supprimer tout autre donnée liée (facultatif selon les contraintes FK, mais mieux vaut nettoyer)
    // Par exemple: rapports, essence, etc. si nécessaire. Supposons que les contraintes FK gèrent ou qu'on veut garder l'historique anonyme.
    // Pour "supprimer de tout le site", on devrait supprimer.
    // Suppresssion des prises d'essence
    $stmt = $pdo->prepare('DELETE FROM prise_essence WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeur_id]);

    // Suppression des signalements
    $stmt = $pdo->prepare('DELETE FROM signalements WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeur_id]);

    // Suppression des rapports
    $stmt = $pdo->prepare('DELETE FROM rapports_trajets WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeur_id]);

    // Suppression des checklists
    $stmt = $pdo->prepare('DELETE FROM checklist_depart WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeur_id]);

    // Mettre à jour les présences (ne pas supprimer l'historique de présence, juste enlever le lien chauffeur)
    $stmt = $pdo->prepare('UPDATE presences SET chauffeur_id = NULL WHERE chauffeur_id = ?');
    $stmt->execute([$chauffeur_id]);

    // 4. Supprimer le chauffeur
    $stmt = $pdo->prepare('DELETE FROM chauffeurs WHERE id = ?');
    $stmt->execute([$chauffeur_id]);
    
    // Supprimer les demandes associées (congés, etc.)
    // Note: tuteur_id dans la table demandes peut contenir l'ID utilisateur du chauffeur
    $stmt = $pdo->prepare('DELETE FROM demandes WHERE tuteur_id = ?');
    $stmt->execute([$utilisateurId]);

    // 5. Supprimer l'utilisateur associé
    if ($utilisateurId) {
        // Supprimer aussi les notifications reçues
        $stmt = $pdo->prepare('DELETE FROM notifications WHERE destinataire_id = ? AND destinataire_type = "chauffeur"');
        $stmt->execute([$utilisateurId]); 
        
        $stmt = $pdo->prepare('DELETE FROM notifications WHERE (destinataire_id = ? OR destinataire_id = ?) AND destinataire_type = "chauffeur"');
        $stmt->execute([$utilisateurId, $chauffeur_id]);


        $stmt = $pdo->prepare('DELETE FROM utilisateurs WHERE id = ?');
        $stmt->execute([$utilisateurId]);
    }
    
    // 6. Notifier le responsable
    if ($responsableId) {
        // Récupérer l'utilisateur_id du responsable
        $stmt = $pdo->prepare('SELECT utilisateur_id FROM responsables_bus WHERE id = ?');
        $stmt->execute([$responsableId]);
        $responsableData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($responsableData) {
            $message = "Le chauffeur " . $chauffeurNom . " du bus " . $busNumero . " a été licencié et supprimé du système.\n\n";
            $message .= "Le bus n'a plus de chauffeur assigné. Veuillez contacter l'administration pour plus de détails.";
            
            $stmt = $pdo->prepare('
                INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, date_creation)
                VALUES (?, ?, ?, ?, ?, NOW())
            ');
            $stmt->execute([
                $responsableData['utilisateur_id'],
                'responsable',
                'Chauffeur licencié',
                $message,
                'alerte'
            ]);
        }
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Chauffeur licencié et supprimé avec succès'
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    // En prod on cache l'erreur SQL, mais ici pour debug on peut l'afficher ou juste logguer
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
