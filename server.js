const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Servir les fichiers statiques - chemin corrigé
app.use('/uploads', express.static(path.join(__dirname, 'data', 'uploads')));

// --- Fichiers JSON ---
const dataDir = path.join(__dirname, 'data');
const productsFile = path.join(dataDir, 'products.json');
const sectionsFile = path.join(dataDir, 'sections.json');

// S'assurer que le dossier data existe
fs.ensureDirSync(dataDir);
fs.ensureDirSync(path.join(dataDir, 'uploads'));

async function readJson(file) {
  try {
    return await fs.readJson(file);
  } catch {
    // Si le fichier n'existe pas, retourner un tableau vide
    return [];
  }
}

async function writeJson(file, data) {
  await fs.writeJson(file, data, { spaces: 2 });
}

// --- Multer pour upload d'images ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'data', 'uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// --- Routes des sections ---
app.get('/sections', async (req, res) => {
  try {
    const sections = await readJson(sectionsFile);
    res.json(sections);
  } catch (error) {
    console.error('Error reading sections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/sections', async (req, res) => {
  try {
    const sections = await readJson(sectionsFile);
    const newSection = { 
      id: Date.now().toString(), 
      name: req.body.name 
    };
    sections.push(newSection);
    await writeJson(sectionsFile, sections);
    res.json(newSection);
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/sections/:id', async (req, res) => {
  try {
    const sections = await readJson(sectionsFile);
    const index = sections.findIndex(s => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Section non trouvée' });
    
    sections[index].name = req.body.name;
    await writeJson(sectionsFile, sections);
    res.json(sections[index]);
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/sections/:id', async (req, res) => {
  try {
    let sections = await readJson(sectionsFile);
    sections = sections.filter(s => s.id !== req.params.id);
    await writeJson(sectionsFile, sections);

    // Supprimer produits liés à cette section
    let products = await readJson(productsFile);
    products = products.filter(p => p.sectionId !== req.params.id);
    await writeJson(productsFile, products);

    res.json({ message: 'Section supprimée' });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Routes des produits ---
app.get('/products', async (req, res) => {
  try {
    const products = await readJson(productsFile);
    res.json(products);
  } catch (error) {
    console.error('Error reading products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/products', upload.single('image'), async (req, res) => {
  try {
    const products = await readJson(productsFile);
    const newProd = {
      id: Date.now().toString(),
      name: req.body.name,
      price: parseFloat(req.body.price) || 0,
      description: req.body.description || '',
      sectionId: req.body.sectionId,
      image: req.file ? `/uploads/${req.file.filename}` : null
    };
    
    products.push(newProd);
    await writeJson(productsFile, products);
    res.json(newProd);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const products = await readJson(productsFile);
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Produit non trouvé' });

    // Mettre à jour les champs
    products[index].name = req.body.name;
    products[index].price = parseFloat(req.body.price) || 0;
    products[index].description = req.body.description || '';
    products[index].sectionId = req.body.sectionId;
    
    // Mettre à jour l'image seulement si une nouvelle image est fournie
    if (req.file) {
      products[index].image = `/uploads/${req.file.filename}`;
    }

    await writeJson(productsFile, products);
    res.json(products[index]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    let products = await readJson(productsFile);
    products = products.filter(p => p.id !== req.params.id);
    await writeJson(productsFile, products);
    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route de santé pour vérifier que l'API fonctionne
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestionnaire d'erreurs global
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
