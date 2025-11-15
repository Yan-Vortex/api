const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dnxzgsazb',
  api_key: process.env.CLOUDINARY_API_KEY || '959122669425937',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'ZRhUx2OxVWyzWO_6QGDwXF14xWE'
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://LauraShop:Laure1975@cluster0.jrqtjbz.mongodb.net/?appName=cluster0';
const DB_NAME = 'laurashop';
const COLLECTIONS = {
  PRODUCTS: 'products',
  SECTIONS: 'sections'
};

let db, productsCollection, sectionsCollection;

// Connexion à MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    productsCollection = db.collection(COLLECTIONS.PRODUCTS);
    sectionsCollection = db.collection(COLLECTIONS.SECTIONS);
    console.log('✅ Connecté à MongoDB Atlas');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

// Configuration Multer pour les images temporaires
const storage = multer.memoryStorage(); // Stockage en mémoire
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Fonction pour uploader une image sur Cloudinary
async function uploadToCloudinary(fileBuffer, folder = 'laurashop') {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: folder,
        quality: 'auto',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(fileBuffer);
  });
}

// Routes pour les sections
app.get('/sections', async (req, res) => {
  try {
    const sections = await sectionsCollection.find({}).sort({ _id: -1 }).toArray();
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/sections', async (req, res) => {
  try {
    const newSection = {
      name: req.body.name,
      createdAt: new Date()
    };
    
    const result = await sectionsCollection.insertOne(newSection);
    res.json({ 
      id: result.insertedId, 
      ...newSection 
    });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ error: 'Erreur création section' });
  }
});

app.put('/sections/:id', async (req, res) => {
  try {
    const result = await sectionsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { name: req.body.name } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Section non trouvée' });
    }
    
    res.json({ message: 'Section mise à jour' });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ error: 'Erreur mise à jour section' });
  }
});

app.delete('/sections/:id', async (req, res) => {
  try {
    // Supprimer la section
    await sectionsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    // Supprimer les produits de cette section
    await productsCollection.deleteMany({ sectionId: req.params.id });
    
    res.json({ message: 'Section et produits associés supprimés' });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Erreur suppression section' });
  }
});

// Routes pour les produits
app.get('/products', async (req, res) => {
  try {
    const products = await productsCollection.find({}).sort({ _id: -1 }).toArray();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/products', upload.single('image'), async (req, res) => {
  try {
    let imageUrl = null;
    
    // Upload de l'image sur Cloudinary si elle existe
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'laurashop/products');
      imageUrl = uploadResult.secure_url;
      console.log('✅ Image uploadée sur Cloudinary:', imageUrl);
    }
    
    const newProduct = {
      name: req.body.name,
      price: parseFloat(req.body.price) || 0,
      description: req.body.description || '',
      sectionId: req.body.sectionId,
      image: imageUrl, // URL Cloudinary permanente
      createdAt: new Date()
    };
    
    const result = await productsCollection.insertOne(newProduct);
    res.json({ 
      id: result.insertedId, 
      ...newProduct 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Erreur création produit' });
  }
});

app.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      price: parseFloat(req.body.price) || 0,
      description: req.body.description || '',
      sectionId: req.body.sectionId
    };
    
    // Upload de la nouvelle image sur Cloudinary si elle existe
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'laurashop/products');
      updateData.image = uploadResult.secure_url;
      console.log('✅ Nouvelle image uploadée sur Cloudinary:', updateData.image);
    }
    
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    res.json({ message: 'Produit mis à jour' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Erreur mise à jour produit' });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const result = await productsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Erreur suppression produit' });
  }
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: db ? 'Connected' : 'Disconnected',
    cloudinary: cloudinary.config().cloud_name ? 'Configured' : 'Not configured',
    timestamp: new Date().toISOString()
  });
});

// Démarrer le serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📊 Base de données: MongoDB Atlas`);
    console.log(`☁️  Stockage images: Cloudinary`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
});
