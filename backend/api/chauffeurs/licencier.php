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
    
    // Récupérer les informations du chauffeur avant suppression
    $stmt = $pdo->prepare('
        SELECT c.id, c.utilisateur_id, c.bus_id, u.nom, u.prenom, b.responsable_id, b.numero as bus_numero
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
    
    // Désaffecter le bus (retirer le chauffeur_id)
    if ($busId) {
        $stmt = $pdo->prepare('UPDATE bus SET chauffeur_id = NULL WHERE id = ?');
        $stmt->execute([$busId]);
    }
    
    // Mettre à jour le statut du chauffeur (au lieu de supprimer)
    $stmt = $pdo->prepare('UPDATE chauffeurs SET statut = "Licencié" WHERE id = ?');
    $stmt->execute([$chauffeur_id]);
    
    // Bloquer l'accès utilisateur (au lieu de supprimer)
    if ($chauffeurData['utilisateur_id']) {
        $stmt = $pdo->prepare('UPDATE utilisateurs SET statut = "Inactif" WHERE id = ?');
        $stmt->execute([$chauffeurData['utilisateur_id']]);
    }
    
    // Notifier le responsable si il y en a un
    if ($responsableId) {
        // ... (Logique de recherche de remplaçant inchangée) ...
        $stmt = $pdo->prepare('
            SELECT c.id, u.nom, u.prenom
            FROM chauffeurs c
            INNER JOIN utilisateurs u ON c.utilisateur_id = u.id
            LEFT JOIN bus b ON c.id = b.chauffeur_id
            WHERE b.chauffeur_id IS NULL AND c.statut = "Actif"
            LIMIT 1
        ');
        $stmt->execute();
        $nouveauChauffeur = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Récupérer l'utilisateur_id du responsable
        $stmt = $pdo->prepare('SELECT utilisateur_id FROM responsables_bus WHERE id = ?');
        $stmt->execute([$responsableId]);
        $responsableData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($responsableData) {
            $message = "Le chauffeur " . $chauffeurNom . " du bus " . $busNumero . " a été licencié par l'administration.\n\n";
            if ($nouveauChauffeur) {
                $message .= "Un nouveau chauffeur vous sera assigné : " . $nouveauChauffeur['prenom'] . " " . $nouveauChauffeur['nom'] . ".\n";
                $message .= "Vous serez informé dès que l'assignation sera effectuée.";
            } else {
                $message .= "Un nouveau chauffeur vous sera assigné prochainement. Vous serez informé dès que l'assignation sera effectuée.";
            }
            
            $stmt = $pdo->prepare('
                INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type)
                VALUES (?, ?, ?, ?, ?)
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
        'message' => 'Chauffeur licencié avec succès'
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_reporting(0);
    ini_set('display_errors', 0);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du licenciement: ' . $e->getMessage()]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_reporting(0);
    ini_set('display_errors', 0);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du licenciement: ' . $e->getMessage()]);
}




