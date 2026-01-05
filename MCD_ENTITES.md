# MODÈLE CONCEPTUEL DE DONNÉES (MCD) - TRANSPORT SCOLAIRE

## LISTE DES ENTITÉS

### 1. **UTILISATEURS**
- **Description** : Table de base pour tous les types d'utilisateurs du système
- **Attributs** :
  - id (PK)
  - nom
  - prenom
  - email (UNIQUE)
  - mot_de_passe
  - mot_de_passe_plain
  - telephone (UNIQUE)
  - statut (Actif, Inactif)
  - date_creation
  - date_modification

### 2. **ADMINISTRATEURS**
- **Description** : Administrateurs du système
- **Attributs** :
  - id (PK)
  - utilisateur_id (FK → UTILISATEURS, UNIQUE)
  - date_creation
- **Relation** : 1:1 avec UTILISATEURS

### 3. **TUTEURS**
- **Description** : Parents/tuteurs des élèves
- **Attributs** :
  - id (PK)
  - utilisateur_id (FK → UTILISATEURS, UNIQUE)
  - adresse
  - date_creation
- **Relation** : 1:1 avec UTILISATEURS

### 4. **CHAUFFEURS**
- **Description** : Chauffeurs de bus
- **Attributs** :
  - id (PK)
  - utilisateur_id (FK → UTILISATEURS, UNIQUE)
  - numero_permis (UNIQUE)
  - date_expiration_permis
  - nombre_accidents
  - salaire
  - statut (Actif, Licencié, Suspendu)
  - date_creation
- **Relation** : 1:1 avec UTILISATEURS

### 5. **RESPONSABLES_BUS**
- **Description** : Responsables de bus (superviseurs)
- **Attributs** :
  - id (PK)
  - utilisateur_id (FK → UTILISATEURS, UNIQUE)
  - zone_responsabilite
  - salaire
  - statut (Actif, Inactif)
  - date_creation
- **Relation** : 1:1 avec UTILISATEURS

### 6. **ÉLÈVES**
- **Description** : Élèves transportés
- **Attributs** :
  - id (PK)
  - nom
  - prenom
  - date_naissance
  - adresse
  - telephone_parent
  - email_parent
  - classe
  - tuteur_id (FK → TUTEURS)
  - statut (Actif, Inactif)
  - date_creation
- **Relation** : N:1 avec TUTEURS

### 7. **ZONES**
- **Description** : Zones géographiques de transport
- **Attributs** :
  - id (PK)
  - nom
  - ville
  - description
  - actif
  - date_creation
  - date_modification
- **Contrainte** : UNIQUE(nom, ville)

### 8. **TRAJETS**
- **Description** : Itinéraires de transport
- **Attributs** :
  - id (PK)
  - nom
  - zones (TEXT - JSON)
  - heure_depart_matin_a
  - heure_arrivee_matin_a
  - heure_depart_soir_a
  - heure_arrivee_soir_a
  - heure_depart_matin_b
  - heure_arrivee_matin_b
  - heure_depart_soir_b
  - heure_arrivee_soir_b
  - date_creation

### 9. **BUS**
- **Description** : Véhicules de transport
- **Attributs** :
  - id (PK)
  - numero (UNIQUE)
  - marque
  - modele
  - annee_fabrication
  - capacite
  - chauffeur_id (FK → CHAUFFEURS)
  - responsable_id (FK → RESPONSABLES_BUS)
  - trajet_id (FK → TRAJETS)
  - statut (Actif, En maintenance, Hors service)
  - date_creation
- **Relations** :
  - N:1 avec CHAUFFEURS
  - N:1 avec RESPONSABLES_BUS
  - N:1 avec TRAJETS

### 10. **ACCIDENTS**
- **Description** : Déclarations d'accidents
- **Attributs** :
  - id (PK)
  - date
  - heure
  - bus_id (FK → BUS)
  - chauffeur_id (FK → CHAUFFEURS)
  - responsable_id (FK → RESPONSABLES_BUS)
  - description
  - degats
  - lieu
  - gravite (Légère, Moyenne, Grave)
  - blesses (BOOLEAN)
  - nombre_eleves
  - nombre_blesses
  - photos (TEXT - JSON array)
  - eleves_concernees (TEXT - JSON array)
  - statut (En attente, Validé)
  - date_creation
- **Relations** :
  - N:1 avec BUS
  - N:1 avec CHAUFFEURS
  - N:1 avec RESPONSABLES_BUS

### 11. **NOTIFICATIONS**
- **Description** : Notifications système
- **Attributs** :
  - id (PK)
  - destinataire_id
  - destinataire_type (chauffeur, responsable, tuteur, admin)
  - titre
  - message
  - type (info, alerte, avertissement, warning, success)
  - lue (BOOLEAN)
  - date

### 12. **DEMANDES**
- **Description** : Demandes d'inscription/modification
- **Attributs** :
  - id (PK)
  - eleve_id (FK → ÉLÈVES)
  - tuteur_id (FK → TUTEURS)
  - type_demande (inscription, modification, desinscription, Augmentation, Congé, Déménagement, Autre)
  - description
  - zone_geographique
  - code_verification (UNIQUE)
  - raison_refus
  - montant_facture
  - statut (En attente, En cours de traitement, En attente de paiement, Payée, Validée, Inscrit, Refusée)
  - date_creation
  - date_traitement
  - traite_par (FK → ADMINISTRATEURS)
- **Relations** :
  - N:1 avec ÉLÈVES
  - N:1 avec TUTEURS
  - N:1 avec ADMINISTRATEURS

### 13. **INSCRIPTIONS**
- **Description** : Inscriptions des élèves aux bus
- **Attributs** :
  - id (PK)
  - eleve_id (FK → ÉLÈVES)
  - bus_id (FK → BUS)
  - date_inscription
  - date_debut
  - date_fin
  - statut (Active, Suspendue, Terminée)
  - montant_mensuel
  - date_creation
- **Relations** :
  - N:1 avec ÉLÈVES
  - N:1 avec BUS

### 14. **PAIEMENTS**
- **Description** : Paiements des inscriptions
- **Attributs** :
  - id (PK)
  - inscription_id (FK → INSCRIPTIONS)
  - montant
  - mois
  - annee
  - date_paiement
  - mode_paiement (Espèces, Virement, Carte bancaire, Chèque)
  - statut (Payé, En attente, Échoué)
  - date_creation
- **Relation** : N:1 avec INSCRIPTIONS

### 15. **PRÉSENCES**
- **Description** : Présences/absences des élèves
- **Attributs** :
  - id (PK)
  - eleve_id (FK → ÉLÈVES)
  - date
  - present_matin (BOOLEAN)
  - present_soir (BOOLEAN)
  - bus_id (FK → BUS)
  - responsable_id (FK → RESPONSABLES_BUS)
  - chauffeur_id (FK → CHAUFFEURS)
  - remarque
  - date_creation
- **Relations** :
  - N:1 avec ÉLÈVES
  - N:1 avec BUS
  - N:1 avec RESPONSABLES_BUS
  - N:1 avec CHAUFFEURS
- **Contrainte** : UNIQUE(eleve_id, date)

### 16. **CONDUIRE**
- **Description** : Table de liaison chauffeurs-trajets
- **Attributs** :
  - id (PK)
  - chauffeur_id (FK → CHAUFFEURS)
  - trajet_id (FK → TRAJETS)
  - bus_id (FK → BUS)
  - date_debut
  - date_fin
  - statut (Actif, Terminé, Suspendu)
  - date_creation
- **Relations** :
  - N:1 avec CHAUFFEURS
  - N:1 avec TRAJETS
  - N:1 avec BUS

### 17. **PRISE_ESSENCE**
- **Description** : Prises d'essence par les chauffeurs
- **Attributs** :
  - id (PK)
  - chauffeur_id (FK → CHAUFFEURS)
  - bus_id (FK → BUS)
  - date
  - heure
  - quantite_litres
  - prix_total
  - kilometrage_actuel
  - station_service
  - photo_ticket
  - date_creation
- **Relations** :
  - N:1 avec CHAUFFEURS
  - N:1 avec BUS

### 18. **RAPPORTS_TRAJET**
- **Description** : Rapports de trajet des chauffeurs
- **Attributs** :
  - id (PK)
  - chauffeur_id (FK → CHAUFFEURS)
  - bus_id (FK → BUS)
  - date
  - periode (matin, soir)
  - heure_depart_prevue
  - heure_depart_reelle
  - heure_arrivee_prevue
  - heure_arrivee_reelle
  - nombre_eleves
  - kilometres_parcourus
  - problemes
  - observations
  - statut (planifie, en_cours, termine, annule)
  - date_creation
- **Relations** :
  - N:1 avec CHAUFFEURS
  - N:1 avec BUS

### 19. **CHECKLIST_DEPART**
- **Description** : Checklists de départ des chauffeurs
- **Attributs** :
  - id (PK)
  - chauffeur_id (FK → CHAUFFEURS)
  - bus_id (FK → BUS)
  - date
  - periode (matin, soir)
  - essence_verifiee (BOOLEAN)
  - pneus_ok (BOOLEAN)
  - portes_ok (BOOLEAN)
  - eclairage_ok (BOOLEAN)
  - nettoyage_fait (BOOLEAN)
  - trousse_secours (BOOLEAN)
  - autres_verifications
  - validee (BOOLEAN)
  - date_creation
- **Relations** :
  - N:1 avec CHAUFFEURS
  - N:1 avec BUS

### 20. **SIGNALEMENTS_MAINTENANCE**
- **Description** : Signalements de problèmes de maintenance
- **Attributs** :
  - id (PK)
  - chauffeur_id (FK → CHAUFFEURS)
  - bus_id (FK → BUS)
  - type_probleme (mecanique, eclairage, portes, climatisation, pneus, autre)
  - description
  - urgence (faible, moyenne, haute)
  - photo (VARCHAR - peut contenir JSON array de base64)
  - statut (en_attente, en_cours, resolu)
  - date_creation
  - date_resolution
- **Relations** :
  - N:1 avec CHAUFFEURS
  - N:1 avec BUS

---

## RÉSUMÉ DES RELATIONS PRINCIPALES

### Relations 1:1
- UTILISATEURS ↔ ADMINISTRATEURS
- UTILISATEURS ↔ TUTEURS
- UTILISATEURS ↔ CHAUFFEURS
- UTILISATEURS ↔ RESPONSABLES_BUS

### Relations N:1
- ÉLÈVES → TUTEURS
- BUS → CHAUFFEURS
- BUS → RESPONSABLES_BUS
- BUS → TRAJETS
- ACCIDENTS → BUS
- ACCIDENTS → CHAUFFEURS
- ACCIDENTS → RESPONSABLES_BUS
- INSCRIPTIONS → ÉLÈVES
- INSCRIPTIONS → BUS
- PAIEMENTS → INSCRIPTIONS
- PRÉSENCES → ÉLÈVES
- PRÉSENCES → BUS
- PRÉSENCES → RESPONSABLES_BUS
- PRÉSENCES → CHAUFFEURS
- DEMANDES → ÉLÈVES
- DEMANDES → TUTEURS
- DEMANDES → ADMINISTRATEURS
- CONDUIRE → CHAUFFEURS
- CONDUIRE → TRAJETS
- CONDUIRE → BUS
- PRISE_ESSENCE → CHAUFFEURS
- PRISE_ESSENCE → BUS
- RAPPORTS_TRAJET → CHAUFFEURS
- RAPPORTS_TRAJET → BUS
- CHECKLIST_DEPART → CHAUFFEURS
- CHECKLIST_DEPART → BUS
- SIGNALEMENTS_MAINTENANCE → CHAUFFEURS
- SIGNALEMENTS_MAINTENANCE → BUS

---

## TOTAL : 20 ENTITÉS


