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
app.use(express.urlencoded({ extended: true })); // IMPORTANT: pour parser FormData
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'data/uploads')));

// --- Fichiers JSON ---
const productsFile = path.join(__dirname, 'products.json');
const sectionsFile = path.join(__dirname, 'sections.json');

async function readJson(file) {
  try {
    return await fs.readJson(file);
  } catch {
    return [];
  }
}
async function writeJson(file, data) {
  await fs.writeJson(file, data, { spaces: 2 });
}

// --- Multer pour upload d'images ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'data/uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop();
    cb(null, `${unique}.${ext}`);
  }
});
const upload = multer({ storage });

// --- Sections endpoints (inchangés) ---
app.get('/sections', async (req, res) => res.json(await readJson(sectionsFile)));

app.post('/sections', async (req, res) => {
  const sections = await readJson(sectionsFile);
  const newSection = { id: Date.now().toString(), name: req.body.name };
  sections.push(newSection);
  await writeJson(sectionsFile, sections);
  res.json(newSection);
});

app.put('/sections/:id', async (req, res) => {
  const sections = await readJson(sectionsFile);
  const index = sections.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).send('Section non trouvée');
  sections[index].name = req.body.name;
  await writeJson(sectionsFile, sections);
  res.json(sections[index]);
});

app.delete('/sections/:id', async (req, res) => {
  let sections = await readJson(sectionsFile);
  sections = sections.filter(s => s.id !== req.params.id);
  await writeJson(sectionsFile, sections);

  let products = await readJson(productsFile);
  products = products.filter(p => p.sectionId !== req.params.id);
  await writeJson(productsFile, products);

  res.sendStatus(200);
});

// --- Products endpoints CORRIGÉS ---
app.get('/products', async (req, res) => res.json(await readJson(productsFile)));

// Ajouter produit avec image - VERSION CORRIGÉE
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
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du produit' });
  }
});

// Modifier produit avec image - VERSION CORRIGÉE
app.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const products = await readJson(productsFile);
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).send('Produit non trouvé');

    products[index].name = req.body.name;
    products[index].price = parseFloat(req.body.price) || 0;
    products[index].description = req.body.description || '';
    products[index].sectionId = req.body.sectionId;
    
    if (req.file) {
      products[index].image = `/uploads/${req.file.filename}`;
    }

    await writeJson(productsFile, products);
    res.json(products[index]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du produit' });
  }
});

// Supprimer produit
app.delete('/products/:id', async (req, res) => {
  let products = await readJson(productsFile);
  products = products.filter(p => p.id !== req.params.id);
  await writeJson(productsFile, products);
  res.sendStatus(200);
});

// --- Start server ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
