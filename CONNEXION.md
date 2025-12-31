# 🔐 Guide de Connexion et Comptes de Test

## 📋 Table des matières
1. [Comptes de test disponibles](#comptes-de-test-disponibles)
2. [Configuration des comptes](#configuration-des-comptes)
3. [Problèmes de connexion](#problèmes-de-connexion)
4. [Conformité des données](#conformité-des-données)
5. [Filtres et recherches](#filtres-et-recherches)
6. [Suppression des données](#suppression-des-données)

---

## 🔑 Comptes de test disponibles

**IMPORTANT :** Tous les comptes utilisent le même mot de passe : **`test123`**

### Comptes par rôle

| Rôle | Email | Mot de passe | URL de connexion |
|------|-------|--------------|------------------|
| **Administrateur** | `admin@transport.ma` | `test123` | `/AdminLogin` |
| **Chauffeur** | `ahmed.idrissi@transport.ma` | `test123` | `/ChauffeurLogin` |
| **Chauffeur** | `youssef.tazi@transport.ma` | `test123` | `/ChauffeurLogin` |
| **Chauffeur** | `karim.elfassi@transport.ma` | `test123` | `/ChauffeurLogin` |
| **Responsable Bus** | `nadia.kettani@transport.ma` | `test123` | `/ResponsableLogin` |
| **Responsable Bus** | `omar.benjelloun@transport.ma` | `test123` | `/ResponsableLogin` |
| **Tuteur** | `mohammed.alami@email.ma` | `test123` | `/TuteurLogin` |
| **Tuteur** | `fatima.benjelloun@email.ma` | `test123` | `/TuteurLogin` |

---

## ⚙️ Configuration des comptes

### 1. Créer/mettre à jour les comptes de test

Exécutez ce script pour créer ou mettre à jour tous les comptes de test avec les vrais hash bcrypt :

```
http://localhost/backend/create_and_update_test_accounts.php
```

**Ce script :**
- ✅ Crée les comptes s'ils n'existent pas
- ✅ Met à jour les mots de passe avec les vrais hash bcrypt
- ✅ Crée les entrées dans les tables spécifiques (administrateurs, chauffeurs, responsables_bus, tuteurs)
- ✅ Assure que tous les comptes ont le statut "Actif"

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Comptes créés/mis à jour avec succès",
  "results": {
    "admin": {"action": "created", "id": 1},
    "responsable": {"action": "created", "id": 2},
    "chauffeur": {"action": "created", "id": 3}
  },
  "accounts": [...]
}
```

### 2. Mettre à jour uniquement les mots de passe

Si vous avez déjà des comptes mais que les mots de passe ne fonctionnent pas :

```
http://localhost/backend/update_test_passwords.php
```

**Ce script :**
- ✅ Met à jour uniquement les mots de passe de tous les comptes de test
- ✅ Utilise le hash bcrypt correct pour "test123"
- ✅ Ne modifie pas les autres informations

---

## 🔧 Problèmes de connexion

### Problème : Impossible d'accéder aux espaces Chauffeur et Responsable

#### Vérification 1 : Les comptes existent-ils dans la base de données ?

Exécutez cette requête SQL dans phpMyAdmin :

```sql
-- Vérifier les utilisateurs
SELECT u.id, u.email, u.statut, 
       CASE 
           WHEN a.id IS NOT NULL THEN 'admin'
           WHEN c.id IS NOT NULL THEN 'chauffeur'
           WHEN r.id IS NOT NULL THEN 'responsable'
           WHEN t.id IS NOT NULL THEN 'tuteur'
           ELSE 'aucun'
       END as role
FROM utilisateurs u
LEFT JOIN administrateurs a ON a.utilisateur_id = u.id
LEFT JOIN chauffeurs c ON c.utilisateur_id = u.id
LEFT JOIN responsables_bus r ON r.utilisateur_id = u.id
LEFT JOIN tuteurs t ON t.utilisateur_id = u.id
WHERE u.email IN (
    'ahmed.idrissi@transport.ma',
    'nadia.kettani@transport.ma',
    'youssef.tazi@transport.ma',
    'karim.elfassi@transport.ma',
    'omar.benjelloun@transport.ma'
);
```

**Résultat attendu :**
- Chaque email doit avoir un `role` correspondant (chauffeur ou responsable)
- Le `statut` doit être "Actif"

#### Vérification 2 : Les entrées dans les tables spécifiques existent-elles ?

```sql
-- Vérifier les chauffeurs
SELECT c.id, u.email, u.statut, c.numero_permis, c.statut as chauffeur_statut
FROM chauffeurs c
JOIN utilisateurs u ON c.utilisateur_id = u.id
WHERE u.email IN (
    'ahmed.idrissi@transport.ma',
    'youssef.tazi@transport.ma',
    'karim.elfassi@transport.ma'
);

-- Vérifier les responsables
SELECT r.id, u.email, u.statut, r.zone_responsabilite, r.statut as responsable_statut
FROM responsables_bus r
JOIN utilisateurs u ON r.utilisateur_id = u.id
WHERE u.email IN (
    'nadia.kettani@transport.ma',
    'omar.benjelloun@transport.ma'
);
```

**Si les résultats sont vides :**
1. Exécutez le script de création : `http://localhost/backend/create_and_update_test_accounts.php`
2. Vérifiez que le script s'exécute sans erreur

#### Vérification 3 : Le mot de passe est-il correct ?

Testez la connexion avec l'API directement :

```bash
# Test de connexion chauffeur
curl -X POST http://localhost/backend/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed.idrissi@transport.ma","password":"test123"}'

# Test de connexion responsable
curl -X POST http://localhost/backend/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"nadia.kettani@transport.ma","password":"test123"}'
```

**Résultat attendu :**
```json
{
  "success": true,
  "token": "...",
  "user": {
    "id": 3,
    "email": "ahmed.idrissi@transport.ma",
    "role": "chauffeur",
    "type_id": 1,
    "statut": "Actif"
  }
}
```

#### Solution : Recréer les comptes manquants

**Option 1 : Utiliser le script PHP (RECOMMANDÉ)**

Exécutez d'abord le script de création :
```
http://localhost/backend/create_and_update_test_accounts.php
```

**Option 2 : Utiliser les requêtes SQL directement**

Si le script PHP ne fonctionne pas, exécutez ces requêtes SQL dans phpMyAdmin :

```sql
-- Étape 1 : Vérifier que les utilisateurs existent
SELECT id, email, statut FROM utilisateurs 
WHERE email IN (
    'ahmed.idrissi@transport.ma',
    'nadia.kettani@transport.ma',
    'youssef.tazi@transport.ma',
    'karim.elfassi@transport.ma',
    'omar.benjelloun@transport.ma'
);

-- Étape 2 : S'assurer que tous les utilisateurs ont le statut "Actif"
UPDATE utilisateurs SET statut = 'Actif' 
WHERE email IN (
    'ahmed.idrissi@transport.ma',
    'nadia.kettani@transport.ma',
    'youssef.tazi@transport.ma',
    'karim.elfassi@transport.ma',
    'omar.benjelloun@transport.ma'
);

-- Étape 3 : Créer les entrées dans chauffeurs si manquantes
-- Pour Ahmed Idrissi
INSERT INTO chauffeurs (utilisateur_id, numero_permis, date_expiration_permis, nombre_accidents, statut)
SELECT u.id, 'CH-001956', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 0, 'Actif'
FROM utilisateurs u
WHERE u.email = 'ahmed.idrissi@transport.ma'
AND NOT EXISTS (SELECT 1 FROM chauffeurs c WHERE c.utilisateur_id = u.id);

-- Pour Youssef Tazi
INSERT INTO chauffeurs (utilisateur_id, numero_permis, date_expiration_permis, nombre_accidents, statut)
SELECT u.id, 'CH-009789', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 1, 'Actif'
FROM utilisateurs u
WHERE u.email = 'youssef.tazi@transport.ma'
AND NOT EXISTS (SELECT 1 FROM chauffeurs c WHERE c.utilisateur_id = u.id);

-- Pour Karim El Fassi
INSERT INTO chauffeurs (utilisateur_id, numero_permis, date_expiration_permis, nombre_accidents, statut)
SELECT u.id, 'CH-000123', DATE_ADD(CURDATE(), INTERVAL 3 YEAR), 0, 'Actif'
FROM utilisateurs u
WHERE u.email = 'karim.elfassi@transport.ma'
AND NOT EXISTS (SELECT 1 FROM chauffeurs c WHERE c.utilisateur_id = u.id);

-- Étape 4 : Créer les entrées dans responsables_bus si manquantes
-- Pour Nadia Kettani
INSERT INTO responsables_bus (utilisateur_id, zone_responsabilite, statut)
SELECT u.id, 'Zone Centre - Maarif, Gauthier, 2 Mars', 'Actif'
FROM utilisateurs u
WHERE u.email = 'nadia.kettani@transport.ma'
AND NOT EXISTS (SELECT 1 FROM responsables_bus r WHERE r.utilisateur_id = u.id);

-- Pour Omar Benjelloun
INSERT INTO responsables_bus (utilisateur_id, zone_responsabilite, statut)
SELECT u.id, 'Zone Nord - Sidi Maarouf, Californie, Oasis', 'Actif'
FROM utilisateurs u
WHERE u.email = 'omar.benjelloun@transport.ma'
AND NOT EXISTS (SELECT 1 FROM responsables_bus r WHERE r.utilisateur_id = u.id);

-- Étape 5 : Vérifier que tout est correct
SELECT 
    u.email,
    u.statut as user_statut,
    CASE 
        WHEN a.id IS NOT NULL THEN 'admin'
        WHEN c.id IS NOT NULL THEN 'chauffeur'
        WHEN r.id IS NOT NULL THEN 'responsable'
        WHEN t.id IS NOT NULL THEN 'tuteur'
        ELSE 'AUCUN TYPE'
    END as role,
    c.statut as chauffeur_statut,
    r.statut as responsable_statut
FROM utilisateurs u
LEFT JOIN administrateurs a ON a.utilisateur_id = u.id
LEFT JOIN chauffeurs c ON c.utilisateur_id = u.id
LEFT JOIN responsables_bus r ON r.utilisateur_id = u.id
LEFT JOIN tuteurs t ON t.utilisateur_id = u.id
WHERE u.email IN (
    'ahmed.idrissi@transport.ma',
    'nadia.kettani@transport.ma',
    'youssef.tazi@transport.ma',
    'karim.elfassi@transport.ma',
    'omar.benjelloun@transport.ma'
);
```

**Résultat attendu :**
- Chaque email doit avoir un `role` (chauffeur ou responsable)
- `user_statut` doit être "Actif"
- `chauffeur_statut` ou `responsable_statut` doit être "Actif"

### Problème : "Type d'utilisateur non reconnu"

**Cause :** L'utilisateur existe dans `utilisateurs` mais n'a pas d'entrée dans la table spécifique (chauffeurs, responsables_bus, etc.)

**Solution :** Exécutez le script de création des comptes ou les requêtes SQL ci-dessus.

### Problème : "Compte désactivé"

**Cause :** Le statut de l'utilisateur n'est pas "Actif"

**Solution :**
```sql
UPDATE utilisateurs SET statut = 'Actif' WHERE email = 'votre@email.ma';
```

---

## ✅ Conformité des données

### Principe fondamental

**RÈGLE ABSOLUE : Les données affichées sur le site doivent correspondre EXACTEMENT à celles de la base de données, sans aucune exception.**

### Exemples de conformité stricte

#### Exemple 1 : Nombre d'élèves inscrits
- **Base de données :** 3 élèves inscrits avec statut "Actif"
- **Site :** Doit afficher EXACTEMENT 3 élèves
- **❌ INACCEPTABLE :** 
  - Afficher 2 élèves
  - Afficher 4 élèves
  - Afficher des doublons
  - Afficher des élèves inactifs mélangés avec des actifs

#### Exemple 2 : Informations d'un élève
- **Base de données :** 
  - Nom = "Alami"
  - Prénom = "Mohammed"
  - Classe = "6ème A"
  - Bus = "BUS-001"
- **Site :** Doit afficher EXACTEMENT ces informations dans cet ordre
- **❌ INACCEPTABLE :** 
  - Afficher "Mohammed Alami" au lieu de "Alami Mohammed"
  - Afficher "6ème B" au lieu de "6ème A"
  - Afficher "BUS-002" au lieu de "BUS-001"
  - Mélanger les informations de plusieurs élèves

#### Exemple 3 : Statut d'une inscription
- **Base de données :** Inscription avec statut = "Active"
- **Site :** Doit afficher "Active" (ou "Actif" si la traduction le permet, mais de manière cohérente)
- **❌ INACCEPTABLE :** 
  - Afficher "Inactive" 
  - Afficher "En attente"
  - Afficher un statut différent de celui de la base de données

#### Exemple 4 : Liste des présences
- **Base de données :** 10 présences enregistrées pour la date 2025-01-15
- **Site :** Doit afficher EXACTEMENT 10 présences pour cette date
- **❌ INACCEPTABLE :** 
  - Afficher 9 ou 11 présences
  - Afficher des présences d'autres dates
  - Afficher des doublons

### Vérification de la conformité

#### Requêtes SQL pour vérifier la conformité

```sql
-- 1. Compter les élèves actifs (doit correspondre au nombre affiché)
SELECT COUNT(*) as total_eleves_actifs 
FROM eleves 
WHERE statut = 'Actif';

-- 2. Compter les inscriptions actives (doit correspondre au nombre affiché)
SELECT COUNT(*) as total_inscriptions_actives 
FROM inscriptions 
WHERE statut = 'Active';

-- 3. Vérifier les données complètes d'un élève spécifique
SELECT 
    e.id,
    e.nom,
    e.prenom,
    e.classe,
    e.statut as eleve_statut,
    i.statut as inscription_statut,
    b.numero as bus_numero,
    t.nom as trajet_nom
FROM eleves e
LEFT JOIN inscriptions i ON i.eleve_id = e.id AND i.statut = 'Active'
LEFT JOIN bus b ON b.id = i.bus_id
LEFT JOIN trajets t ON t.id = b.trajet_id
WHERE e.id = 1;

-- 4. Vérifier les présences pour une date précise
SELECT COUNT(*) as total_presences
FROM presences
WHERE date = '2025-01-15';

-- 5. Vérifier qu'il n'y a pas de doublons dans les inscriptions actives
SELECT eleve_id, COUNT(*) as nombre_inscriptions
FROM inscriptions
WHERE statut = 'Active'
GROUP BY eleve_id
HAVING COUNT(*) > 1;
-- Cette requête doit retourner 0 lignes (aucun doublon)
```

**Le nombre affiché sur le site doit correspondre EXACTEMENT au résultat de ces requêtes, sans exception.**

### Actions en cas de non-conformité

Si vous constatez une non-conformité :

1. **Vérifier la requête SQL** utilisée côté backend
2. **Vérifier le filtrage** côté frontend
3. **Vérifier les jointures** SQL qui pourraient créer des doublons
4. **Vérifier les conditions WHERE** qui pourraient exclure des données valides
5. **Comparer ligne par ligne** les données de la base avec celles affichées

### Bonnes pratiques

- ✅ Toujours utiliser `DISTINCT` ou `GROUP BY` si nécessaire pour éviter les doublons
- ✅ Toujours filtrer par statut approprié (Actif, Active, etc.)
- ✅ Toujours vérifier les jointures LEFT JOIN vs INNER JOIN selon le besoin
- ✅ Toujours tester les requêtes SQL directement avant de les intégrer
- ✅ Toujours comparer le résultat SQL avec l'affichage frontend

---

## 🔍 Filtres et recherches

### Espace Tuteur

Les tuteurs peuvent filtrer et rechercher par :

1. **Nom** - Recherche dans le nom de l'élève
2. **Prénom** - Recherche dans le prénom de l'élève
3. **Classe** - Filtre par classe (ex: "6ème A", "5ème B")
4. **Groupe de transport** - Filtre par groupe (ex: "Matin", "Soir")
5. **Bus** - Filtre par numéro de bus (ex: "BUS-001")

**Exemple d'utilisation :**
- Rechercher tous les élèves de la classe "6ème A"
- Filtrer par bus "BUS-001"
- Rechercher un élève par nom "Alami"

### Espaces Chauffeur, Responsable, Admin

Ces espaces permettent de filtrer et rechercher par :

1. **Nom** - Recherche dans le nom de l'élève
2. **Prénom** - Recherche dans le prénom de l'élève
3. **Classe** - Filtre par classe
4. **Groupe de transport** - Filtre par groupe
5. **Bus** - Filtre par numéro de bus

### Filtres pour les absences

**Filtrage par date :** Permet de connaître qui était absent un jour précis.

**Exemple :**
- Filtrer les absences du **01/01/2025**
- Résultat : Liste de tous les élèves absents ce jour-là avec leurs informations (nom, prénom, classe, bus)

**Utilisation :**
1. Sélectionner la date dans le filtre
2. Le système affiche toutes les absences de cette date
3. Les informations affichées incluent :
   - Nom et prénom de l'élève
   - Classe
   - Bus assigné
   - Heure de l'absence
   - Raison (si renseignée)

### Implémentation technique

Les filtres sont implémentés côté frontend et backend :

**Frontend :**
- Champs de recherche avec debounce
- Dropdowns pour les filtres (classe, bus, groupe)
- Sélecteur de date pour les absences

**Backend :**
- Requêtes SQL avec clauses `WHERE` dynamiques
- Filtrage par date avec `DATE()` pour les absences
- Recherche avec `LIKE` pour le texte

---

## 🗑️ Suppression des données

### Permissions par espace

#### Espace Tuteur

**Le tuteur peut supprimer :**
- ✅ Une inscription **non encore validée** (statut = "En attente" ou "En cours de traitement")
- ✅ Une demande d'inscription non traitée

**Le tuteur ne peut pas supprimer :**
- ❌ Une inscription validée (statut = "Active")
- ❌ Un élève déjà inscrit et actif
- ❌ Des données d'autres tuteurs

**Exemple :**
```sql
-- Le tuteur peut supprimer cette demande
DELETE FROM demandes 
WHERE id = 1 
AND tuteur_id = 1 
AND statut = 'En attente';

-- Le tuteur NE PEUT PAS supprimer cette inscription
-- (car elle est déjà validée)
-- DELETE FROM inscriptions WHERE id = 1 AND statut = 'Active'; ❌
```

#### Espace Chauffeur

**Le chauffeur peut supprimer :**
- ✅ Ses propres présences (si erreur de saisie)
- ✅ Ses propres signalements d'absence (non confirmés)

**Le chauffeur ne peut pas supprimer :**
- ❌ Les élèves
- ❌ Les inscriptions
- ❌ Les données d'autres chauffeurs

#### Espace Responsable

**Le responsable peut supprimer :**
- ✅ Les présences dans sa zone (avec confirmation)
- ✅ Les signalements d'absence dans sa zone

**Le responsable ne peut pas supprimer :**
- ❌ Les élèves
- ❌ Les inscriptions
- ❌ Les données hors de sa zone

#### Espace Administrateur

**L'administrateur peut supprimer :**
- ✅ Tous les éléments selon les droits administrateur :
  - Élèves
  - Inscriptions
  - Bus
  - Trajets
  - Chauffeurs
  - Responsables
  - Demandes
  - Paiements
  - Accidents
  - Présences

**⚠️ Attention :** La suppression d'un élément peut avoir des conséquences en cascade :
- Supprimer un élève supprime ses inscriptions
- Supprimer un bus peut affecter les inscriptions
- Supprimer un chauffeur peut affecter les bus assignés

### Confirmation de suppression

Toutes les suppressions nécessitent une confirmation :

**Interface :**
```
Êtes-vous sûr de vouloir supprimer cet élément ?
[Annuler] [Confirmer]
```

**Backend :**
- Vérification des permissions avant suppression
- Vérification des dépendances (foreign keys)
- Suppression en cascade si configurée dans la base de données

### Suppression sécurisée

**Avant de supprimer :**
1. Vérifier les dépendances
2. Informer l'utilisateur des conséquences
3. Demander confirmation
4. Logger l'action (qui, quoi, quand)

**Exemple de vérification :**
```sql
-- Avant de supprimer un bus, vérifier les inscriptions
SELECT COUNT(*) as inscriptions_actives
FROM inscriptions
WHERE bus_id = 1 AND statut = 'Active';

-- Si > 0, ne pas permettre la suppression sans réaffectation
```

---

## 📝 Notes importantes

1. **Toujours utiliser le script de création** pour initialiser les comptes de test
2. **Vérifier le statut** des comptes avant de tester la connexion
3. **Les mots de passe** sont hashés avec bcrypt, jamais en clair
4. **Les données affichées** doivent toujours correspondre à la base de données
5. **Les filtres** doivent être testés avec différentes combinaisons
6. **Les suppressions** nécessitent toujours une confirmation

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez que la base de données est correctement importée
2. Exécutez le script de création des comptes
3. Vérifiez les logs du serveur (Apache/PHP)
4. Vérifiez la console du navigateur (F12)
5. Vérifiez les requêtes SQL dans phpMyAdmin

