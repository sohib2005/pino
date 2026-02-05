# Système de Commandes Pino

## 📋 Vue d'ensemble

Le système de commandes complet a été implémenté avec succès, incluant :
- ✅ Panier d'achat
- ✅ Passation de commandes
- ✅ Gestion automatique du stock
- ✅ Statuts de commandes
- ✅ Interface admin
- ✅ Interface client

## 🗄️ Structure de Base de Données

### Tables créées :
1. **carts** - Paniers des utilisateurs
2. **cart_items** - Articles dans les paniers
3. **orders** - Commandes passées
4. **order_items** - Détails des articles commandés

### Enum OrderStatus :
- `EN_ATTENTE` - Commande en attente de traitement
- `EN_COURS` - Commande en cours de préparation/livraison
- `LIVRE` - Commande livrée
- `ANNULE` - Commande annulée

## 🔄 Flux de Commande

### 1. Ajout au Panier
```typescript
// Frontend - ProductModal.tsx
await cartApi.add(variantId, quantity);
```
- Vérifie le stock disponible
- Crée un panier si nécessaire
- Ajoute ou met à jour la quantité

### 2. Visualisation du Panier
**URL:** `/cart`
- Affiche tous les articles
- Permet de modifier les quantités
- Affiche le total
- Bouton de passation de commande

### 3. Passation de Commande
```typescript
// Depuis /cart
await ordersApi.create({
  address: 'Adresse de livraison',
  phoneNumber: '50770418',
  notes: 'Notes optionnelles'
});
```

**Processus automatique :**
1. ✅ Vérification du stock pour tous les articles
2. ✅ Création de la commande avec numéro unique
3. ✅ Réduction automatique du stock
4. ✅ Enregistrement des mouvements de stock
5. ✅ Vidage du panier
6. ✅ Redirection vers les commandes

### 4. Gestion du Stock
**Déduction automatique :**
- Lors de la création d'une commande, le stock est réduit
- Un mouvement de stock est enregistré (`type: OUT`)
- Raison : "Commande ORD-XXXXX"

**Remise en stock :**
- Lors de l'annulation d'une commande
- Stock restauré automatiquement
- Mouvement enregistré (`type: IN`)

## 🎯 Pages Frontend

### Client

#### `/cart` - Panier
- Liste des articles avec images
- Modification des quantités
- Suppression d'articles
- Formulaire de commande
- Calcul du total en temps réel

#### `/orders` - Mes Commandes
- Liste toutes les commandes du client
- Affiche le statut avec code couleur
- Détails complets de chaque commande
- Possibilité d'annuler si `EN_ATTENTE`

### Admin

#### `/admin/orders` - Gestion des Commandes
**Statistiques :**
- Total des commandes
- Nombre en attente
- Nombre en cours
- Nombre livrées
- Revenu total

**Fonctionnalités :**
- Filtrage par statut
- Changement de statut direct
- Vue détaillée de chaque commande
- Informations complètes du client

## 🔌 API Backend

### Cart API

#### GET `/cart`
Récupère le panier de l'utilisateur

#### POST `/cart/add`
```json
{
  "variantId": 1,
  "quantity": 2
}
```

#### PUT `/cart/items/:id`
```json
{
  "quantity": 3
}
```

#### DELETE `/cart/items/:id`
Supprime un article du panier

#### DELETE `/cart/clear`
Vide complètement le panier

### Orders API

#### POST `/orders`
```json
{
  "address": "123 Rue Example, Djerba",
  "phoneNumber": "50770418",
  "notes": "Livraison après 18h"
}
```

#### GET `/orders`
Liste toutes les commandes de l'utilisateur connecté

#### GET `/orders/all`
**Admin** - Liste toutes les commandes de tous les clients

#### GET `/orders/:id`
Détails d'une commande spécifique

#### PUT `/orders/:id/status`
```json
{
  "status": "EN_COURS"
}
```

#### PUT `/orders/:id/cancel`
Annule une commande (seulement si EN_ATTENTE)

## 🚀 Utilisation

### Démarrer le Backend
```bash
cd Backend
npm run start:dev
```

### Démarrer le Frontend
```bash
cd Frontend
npm run dev
```

### Tester le Système

1. **Ajouter au panier :**
   - Aller sur `/boutique`
   - Cliquer sur un produit
   - Sélectionner taille et couleur
   - Cliquer "Ajouter au panier"

2. **Passer une commande :**
   - Aller sur `/cart`
   - Vérifier les articles
   - Cliquer "Passer la commande"
   - Remplir l'adresse et téléphone
   - Confirmer

3. **Voir ses commandes :**
   - Aller sur `/orders`
   - Consulter le statut
   - Annuler si nécessaire

4. **Gérer les commandes (Admin) :**
   - Aller sur `/admin/orders`
   - Filtrer par statut
   - Changer le statut des commandes
   - Voir les détails

## 💾 Gestion du Stock

### Stock Initial
Défini dans `prisma/seed.ts` :
```typescript
await prisma.productVariant.create({
  data: {
    sku: 'TSHIRT-BLANC-M',
    price: 24.99,
    stock: 50,  // Stock initial
    // ...
  },
});
```

### Vérification du Stock
Avant l'ajout au panier et la commande :
```typescript
if (variant.stock < quantity) {
  throw new Error('Stock insuffisant');
}
```

### Historique des Mouvements
Table `stock_movements` :
- Type: `IN` (entrée) ou `OUT` (sortie)
- Quantité
- Raison (ex: "Commande ORD-...")
- Date/heure

## ⚙️ Configuration

### Variables d'Environnement Backend
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pino_db"
```

### Variables d'Environnement Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### User ID Temporaire
En attendant l'authentification complète, l'ID utilisateur est défini dans :
- `localStorage.getItem('userId')` ou
- Valeur par défaut : `'024ec841-36c9-4a6c-8173-c1c423e2095b'`

## 🎨 Statuts et Couleurs

| Statut | Couleur | Signification |
|--------|---------|---------------|
| EN_ATTENTE | Jaune | Commande reçue, en attente de traitement |
| EN_COURS | Bleu | Commande en cours de préparation/livraison |
| LIVRE | Vert | Commande livrée au client |
| ANNULE | Rouge | Commande annulée |

## 📊 Exemple de Données

### Commande Créée
```json
{
  "id": "uuid",
  "orderNumber": "ORD-1737066789123-ABC123XYZ",
  "status": "EN_ATTENTE",
  "totalAmount": 74.97,
  "address": "Djerba, Tunisie",
  "phoneNumber": "50770418",
  "items": [
    {
      "quantity": 3,
      "unitPrice": 24.99,
      "totalPrice": 74.97,
      "variant": {
        "sku": "TSHIRT-BLANC-M",
        "product": {
          "name": "T-shirt Premium Pino"
        }
      }
    }
  ]
}
```

## 🔐 Sécurité (À implémenter)

- [ ] Authentification JWT
- [ ] Validation des rôles (ADMIN vs CLIENT)
- [ ] Protection CSRF
- [ ] Rate limiting
- [ ] Validation des données

## 📝 Notes

- Le stock est mis à jour en temps réel
- Les commandes sont triées par date de création (plus récent en premier)
- Seules les commandes EN_ATTENTE peuvent être annulées
- L'annulation restaure le stock automatiquement
- Chaque commande a un numéro unique généré automatiquement

## 🐛 Dépannage

### Le panier est vide après ajout
- Vérifier que le backend est démarré
- Vérifier la console pour les erreurs
- Vérifier l'userId dans localStorage

### Erreur "Stock insuffisant"
- Le stock réel est inférieur à la quantité demandée
- Vérifier la table `product_variants`

### Commande non créée
- Vérifier que le panier n'est pas vide
- Vérifier les champs requis (address, phoneNumber)
- Consulter les logs backend

## ✅ Système Complet et Fonctionnel

Toutes les fonctionnalités ont été implémentées et testées :
- ✅ Ajout au panier avec vérification du stock
- ✅ Modification des quantités
- ✅ Passation de commandes
- ✅ Gestion automatique du stock
- ✅ Statuts de commandes
- ✅ Interface admin complète
- ✅ Interface client intuitive
- ✅ Annulation avec remise en stock
