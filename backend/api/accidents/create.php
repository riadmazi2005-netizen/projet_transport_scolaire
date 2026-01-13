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
    
    // Préparer les valeurs pour l'insertion
    $date = $data['date'] ?? null;
    $heure = $data['heure'] ?? null;
    $bus_id = isset($data['bus_id']) && $data['bus_id'] !== '' ? (int)$data['bus_id'] : null;
    $chauffeur_id = isset($data['chauffeur_id']) && $data['chauffeur_id'] !== '' ? (int)$data['chauffeur_id'] : null;
    $responsable_id = isset($data['responsable_id']) && $data['responsable_id'] !== '' ? (int)$data['responsable_id'] : null;
    $description = $data['description'] ?? '';
    $degats = $data['degats'] ?? null;
    $lieu = $data['lieu'] ?? null;
    $gravite = $data['gravite'] ?? 'Légère';
    $blesses = isset($data['blesses']) ? (bool)$data['blesses'] : false;
    $nombre_eleves = isset($data['nombre_eleves']) ? (int)$data['nombre_eleves'] : null;
    $nombre_blesses = isset($data['nombre_blesses']) ? (int)$data['nombre_blesses'] : null;
    $photos = isset($data['photos']) ? json_encode($data['photos']) : null;
    
    if (!$date || !$description || !$gravite) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Date, description et gravité sont obligatoires']);
        exit;
    }
    
    // Si pas de bus_id mais qu'on a un responsable_id, essayer de trouver le bus
    if (!$bus_id && $responsable_id) {
        $stmt = $pdo->prepare('SELECT id FROM bus WHERE responsable_id = ? LIMIT 1');
        $stmt->execute([$responsable_id]);
        $bus = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($bus) {
            $bus_id = $bus['id'];
        }
    }
    
    // Si pas de bus_id mais qu'on a un chauffeur_id, essayer de trouver le bus assigné
    if (!$bus_id && $chauffeur_id) {
        $stmt = $pdo->prepare('SELECT id FROM bus WHERE chauffeur_id = ? LIMIT 1');
        $stmt->execute([$chauffeur_id]);
        $bus = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($bus) {
            $bus_id = $bus['id'];
        }
    }

    // Validation stricte : un accident doit être lié à un bus
    if (!$bus_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Impossible de déclarer un accident sans être assigné à un bus.']);
        exit;
    }
    
    $elevesConcernees = isset($data['eleves_concernees']) ? json_encode($data['eleves_concernees']) : null;
    
    // Vérifier quelles colonnes existent dans la table accidents
    $checkResponsable = $pdo->query("SHOW COLUMNS FROM accidents LIKE 'responsable_id'");
    $hasResponsable = $checkResponsable->rowCount() > 0;
    
    $checkPhotos = $pdo->query("SHOW COLUMNS FROM accidents LIKE 'photos'");
    $hasPhotos = $checkPhotos->rowCount() > 0;
    
    $checkEleves = $pdo->query("SHOW COLUMNS FROM accidents LIKE 'eleves_concernees'");
    $hasEleves = $checkEleves->rowCount() > 0;
    
    $checkStatut = $pdo->query("SHOW COLUMNS FROM accidents LIKE 'statut'");
    $hasStatut = $checkStatut->rowCount() > 0;
    
    // Construire la requête INSERT dynamiquement selon les colonnes disponibles
    $columns = ['date', 'heure', 'bus_id', 'chauffeur_id', 'description', 'degats', 'lieu', 'gravite', 'blesses', 'nombre_eleves', 'nombre_blesses'];
    $values = [$date, $heure, $bus_id, $chauffeur_id, $description, $degats, $lieu, $gravite, $blesses ? 1 : 0, $nombre_eleves, $nombre_blesses];
    $placeholders = ['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?'];
    
    if ($hasResponsable) {
        $columns[] = 'responsable_id';
        $values[] = $responsable_id;
        $placeholders[] = '?';
    }
    
    if ($hasPhotos) {
        $columns[] = 'photos';
        $values[] = $photos;
        $placeholders[] = '?';
    }
    
    if ($hasEleves) {
        $columns[] = 'eleves_concernees';
        $values[] = $elevesConcernees;
        $placeholders[] = '?';
    }
    
    if ($hasStatut) {
        $columns[] = 'statut';
        $values[] = 'En attente';
        $placeholders[] = '?';
    }
    
    $sql = 'INSERT INTO accidents (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    $accidentId = $pdo->lastInsertId();
    
    // Mettre à jour le compteur d'accidents du chauffeur si un chauffeur est spécifié
    // Vérifier d'abord si la colonne nombre_accidents existe
    if ($chauffeur_id) {
        try {
            $checkCol = $pdo->query("SHOW COLUMNS FROM chauffeurs LIKE 'nombre_accidents'");
            if ($checkCol->rowCount() > 0) {
                // Récupérer l'utilisateur_id du chauffeur avant la mise à jour
                $stmt = $pdo->prepare('SELECT utilisateur_id, nombre_accidents FROM chauffeurs WHERE id = ?');
                $stmt->execute([$chauffeur_id]);
                $chauffeurAvant = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Mettre à jour le compteur d'accidents
                $stmt = $pdo->prepare('
                    UPDATE chauffeurs 
                    SET nombre_accidents = nombre_accidents + 1 
                    WHERE id = ?
                ');
                $stmt->execute([$chauffeur_id]);
                
                // Récupérer le nouveau nombre d'accidents
                $stmt = $pdo->prepare('SELECT nombre_accidents, statut FROM chauffeurs WHERE id = ?');
                $stmt->execute([$chauffeur_id]);
                $chauffeur = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($chauffeur && $chauffeurAvant) {
                    $nouveauNombreAccidents = $chauffeur['nombre_accidents'];
                    $utilisateurId = $chauffeurAvant['utilisateur_id'];
                    
                    // Envoyer une notification d'avertissement après chaque accident
                    $avertissementMessage = "Vous avez eu un nouvel accident.\n\n";
                    $avertissementMessage .= "Nombre total d'accidents: {$nouveauNombreAccidents}/3\n\n";
                    
                    if ($nouveauNombreAccidents >= 3) {
                        $avertissementMessage .= "⚠️ ATTENTION : Suite à votre 3ème accident, vous serez licencié conformément au règlement.";
                    } else {
                        $accidentsRestants = 3 - $nouveauNombreAccidents;
                        $avertissementMessage .= "Attention : Il vous reste {$accidentsRestants} accident(s) avant le licenciement automatique.";
                    }
                    
                    $stmt = $pdo->prepare('
                        INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue)
                        VALUES (?, ?, ?, ?, ?, FALSE)
                    ');
                    $stmt->execute([
                        $utilisateurId,
                        'chauffeur',
                        'Avertissement - Accident déclaré',
                        $avertissementMessage,
                        'avertissement'
                    ]);
                    
                    if ($nouveauNombreAccidents >= 3) {
                        // 1. Désaffecter le bus (retirer le chauffeur_id)
                        $stmt = $pdo->prepare('UPDATE bus SET chauffeur_id = NULL WHERE chauffeur_id = ?');
                        $stmt->execute([$chauffeur_id]);

                        // 2. Supprimer les accidents liés à ce chauffeur
                        // Attention : on vient de créer un accident (celui-ci), il sera aussi supprimé, 
                        // ce qui est correct si le chauffeur est supprimé complètement du site.
                        // Mais l'admin voudra peut-être garder une trace de l'accident ? 
                        // Le user a dit "supprimé directement de site et base de donne".
                        // On va donc tout supprimer.
                        $stmt = $pdo->prepare('DELETE FROM accidents WHERE chauffeur_id = ?');
                        $stmt->execute([$chauffeur_id]);
                        
                        // 3. Supprimer tout autre donnée liée
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
                        
                        // Supprimer les demandes associées
                        $stmt = $pdo->prepare('DELETE FROM demandes WHERE tuteur_id = ?');
                        $stmt->execute([$utilisateurId]);

                        // 5. Supprimer l'utilisateur associé
                        if ($utilisateurId) {
                            $stmt = $pdo->prepare('DELETE FROM notifications WHERE destinataire_id = ? AND destinataire_type = "chauffeur"');
                            $stmt->execute([$utilisateurId]); 
                            
                            $stmt = $pdo->prepare('DELETE FROM notifications WHERE (destinataire_id = ? OR destinataire_id = ?) AND destinataire_type = "chauffeur"');
                            $stmt->execute([$utilisateurId, $chauffeur_id]);

                            $stmt = $pdo->prepare('DELETE FROM utilisateurs WHERE id = ?');
                            $stmt->execute([$utilisateurId]);
                        }
                        
                        // Notifier le responsable du bus si assigné
                        // (On doit le faire AVANT la suppression si on veut les infos, mais on a déjà récupéré responsable_id via $busInfo plus haut ou on peut le refaire si besoin, mais ici on n'a pas $busInfo facile.
                        // On va utiliser la logique existante un peu plus haut pour le responsable si dispo, 
                        // ou juste envoyer une notif générique au responsable du bus s'il y en a un.
                        
                        // Récupération bus info pour notif responsable (si pas déjà fait)
                        // On sait que le bus a été désaffecté à l'étape 1, mais on peut retrouver le responsable via la table bus (le chauffeur_id est null maintenant mais le bus existe)
                        // Ah, on a perdu le lien bus-chauffeur. 
                        // On aurait du choper le responsable AVANT de désaffecter.
                        // Mais on a $bus_id de l'accident courant !
                        
                        if ($bus_id) {
                            $stmt = $pdo->prepare('SELECT responsable_id, numero FROM bus WHERE id = ?');
                            $stmt->execute([$bus_id]);
                            $busInfoForNotif = $stmt->fetch(PDO::FETCH_ASSOC);
                            
                            if ($busInfoForNotif && $busInfoForNotif['responsable_id']) {
                                $stmt = $pdo->prepare('SELECT utilisateur_id FROM responsables_bus WHERE id = ?');
                                $stmt->execute([$busInfoForNotif['responsable_id']]);
                                $respUser = $stmt->fetch(PDO::FETCH_ASSOC);

                                if ($respUser) {
                                    $stmt = $pdo->prepare('
                                        INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, date_creation)
                                        VALUES (?, ?, ?, ?, ?, NOW())
                                    ');
                                    $stmt->execute([
                                        $respUser['utilisateur_id'],
                                        'responsable',
                                        'Licenciement automatique',
                                        "Le chauffeur du bus {$busInfoForNotif['numero']} a été licencié et supprimé automatiquement suite à son 3ème accident.",
                                        'alerte'
                                    ]);
                                }
                            }
                        }
                    }
                }
            }
        } catch (PDOException $e) {
            // Ignorer l'erreur si la colonne n'existe pas
        }
    }
    
    // Si c'est un responsable qui déclare, notifier le chauffeur du bus assigné
    if ($responsable_id && $bus_id) {
        $stmt = $pdo->prepare('SELECT chauffeur_id, numero FROM bus WHERE id = ?');
        $stmt->execute([$bus_id]);
        $busData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($busData && $busData['chauffeur_id']) {
            $chauffeurIdAssigne = $busData['chauffeur_id'];
            
            // Récupérer l'utilisateur ID du chauffeur
            $stmt = $pdo->prepare('SELECT utilisateur_id FROM chauffeurs WHERE id = ?');
            $stmt->execute([$chauffeurIdAssigne]);
            $chauffeurUser = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($chauffeurUser) {
                // Nom du responsable pour le message
                $responsableNom = "un responsable";
                $stmt = $pdo->prepare('SELECT u.nom, u.prenom FROM responsables_bus Rb JOIN utilisateurs u ON Rb.utilisateur_id = u.id WHERE Rb.id = ?');
                $stmt->execute([$responsable_id]);
                $respInfo = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($respInfo) {
                    $responsableNom = $respInfo['prenom'] . ' ' . $respInfo['nom'];
                }

                $messageChauffeur = "⚠️ SIGNALEMENT D'ACCIDENT\n\n";
                $messageChauffeur .= "Un accident a été signalé pour votre bus {$busData['numero']} par {$responsableNom}.\n\n";
                $messageChauffeur .= "📅 Date: " . $date . ($heure ? " à " . $heure : "") . "\n";
                $messageChauffeur .= "📍 Lieu: " . ($lieu ?: "Non précisé") . "\n";
                $messageChauffeur .= "⚡ Gravité: " . $gravite . "\n";
                if ($degats) $messageChauffeur .= "💥 Dégâts: " . $degats . "\n";
                if ($nombre_eleves !== null) $messageChauffeur .= "👥 Élèves à bord: " . $nombre_eleves . "\n";
                if ($blesses) $messageChauffeur .= "🚑 Blessés: " . ($nombre_blesses ?: "Oui") . "\n";
                $messageChauffeur .= "\n📝 Description:\n" . $description;

                $stmt = $pdo->prepare('
                    INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue)
                    VALUES (?, ?, ?, ?, ?, FALSE)
                ');
                $stmt->execute([
                    $chauffeurUser['utilisateur_id'],
                    'chauffeur',
                    'Accident signalé par responsable',
                    $messageChauffeur,
                    'alerte'
                ]);
            }
        }
    }

    // Envoyer une notification à tous les admins
    $stmt = $pdo->query('
        SELECT u.id 
        FROM utilisateurs u
        INNER JOIN administrateurs a ON a.utilisateur_id = u.id
    ');
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $busNumero = '';
    if ($bus_id) {
        $stmt = $pdo->prepare('SELECT numero FROM bus WHERE id = ?');
        $stmt->execute([$bus_id]);
        $busData = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($busData) {
            $busNumero = $busData['numero'];
        }
    }
    
    $declarant = '';
    if ($chauffeur_id) {
        $stmt = $pdo->prepare('
            SELECT u.nom, u.prenom 
            FROM chauffeurs c
            INNER JOIN utilisateurs u ON c.utilisateur_id = u.id
            WHERE c.id = ?
        ');
        $stmt->execute([$chauffeur_id]);
        $chauffeurData = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($chauffeurData) {
            $declarant = $chauffeurData['prenom'] . ' ' . $chauffeurData['nom'] . ' (Chauffeur)';
        }
    } elseif ($responsable_id) {
        $stmt = $pdo->prepare('
            SELECT u.nom, u.prenom 
            FROM responsables_bus r
            INNER JOIN utilisateurs u ON r.utilisateur_id = u.id
            WHERE r.id = ?
        ');
        $stmt->execute([$responsable_id]);
        $responsableData = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($responsableData) {
            $declarant = $responsableData['prenom'] . ' ' . $responsableData['nom'] . ' (Responsable)';
        }
    }
    
    foreach ($admins as $admin) {
        $message = "⚠️ NOUVEL ACCIDENT DÉCLARÉ\n\n";
        $message .= "👤 Déclaré par: " . $declarant . "\n";
        $message .= "📅 Date: " . $date . ($heure ? " à " . $heure : "") . "\n";
        if ($busNumero) {
            $message .= "🚌 Bus: " . $busNumero . "\n";
        }
        $message .= "📍 Lieu: " . ($lieu ?: "Non précisé") . "\n";
        $message .= "⚡ Gravité: " . $gravite . "\n";
        if ($degats) $message .= "💥 Dégâts: " . $degats . "\n";
        if ($nombre_eleves !== null) $message .= "👥 Élèves à bord: " . $nombre_eleves . "\n";
        if ($blesses) $message .= "🚑 Blessés: " . ($nombre_blesses ?: "Oui") . "\n";
        $message .= "\n📝 Description:\n" . $description;
        
        $stmt = $pdo->prepare('
            INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $admin['id'],
            'admin',
            'Nouvel accident déclaré',
            $message,
            'alerte'
        ]);
    }
    
    // Récupérer l'accident créé
    $stmt = $pdo->prepare('SELECT * FROM accidents WHERE id = ?');
    $stmt->execute([$accidentId]);
    $accident = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Décoder les photos si présentes
    if (isset($accident['photos']) && $accident['photos']) {
        try {
            $decoded = json_decode($accident['photos'], true);
            if ($decoded !== null) {
                $accident['photos'] = $decoded;
            }
        } catch (Exception $e) {
            // Garder la valeur originale si le décodage échoue
        }
    }
    
    // Décoder les élèves concernés si présents
    if (isset($accident['eleves_concernees']) && $accident['eleves_concernees']) {
        try {
            $decoded = json_decode($accident['eleves_concernees'], true);
            if ($decoded !== null) {
                $accident['eleves_concernees'] = $decoded;
            }
        } catch (Exception $e) {
            // Garder la valeur originale si le décodage échoue
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $accident
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    error_reporting(0);
    ini_set('display_errors', 0);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    error_reporting(0);
    ini_set('display_errors', 0);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création: ' . $e->getMessage()]);
}



