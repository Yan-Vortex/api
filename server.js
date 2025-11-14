const express = require('express');
const fs = require('fs-extra');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Pour servir ton index.html et assets

// Fichiers JSON
const sectionsFile = path.join(__dirname, 'sections.json');
const productsFile = path.join(__dirname, 'products.json');

// Initialisation fichiers si n'existent pas
fs.ensureFileSync(sectionsFile);
fs.ensureFileSync(productsFile);
fs.writeJsonSync(sectionsFile, fs.readJsonSync(sectionsFile, {throws:false}) || []);
fs.writeJsonSync(productsFile, fs.readJsonSync(productsFile, {throws:false}) || []);

// Utils
const readJson = file => fs.readJson(file).catch(()=>[]);
const writeJson = (file, data) => fs.writeJson(file, data);

// --- Sections ---
app.get('/sections', async (req, res) => res.json(await readJson(sectionsFile)));

app.post('/sections', async (req, res) => {
  const sections = await readJson(sectionsFile);
  const newSec = { id: Date.now().toString(), name: req.body.name };
  sections.push(newSec);
  await writeJson(sectionsFile, sections);
  res.json(newSec);
});

app.put('/sections/:id', async (req, res) => {
  const sections = await readJson(sectionsFile);
  const index = sections.findIndex(s => s.id === req.params.id);
  if(index === -1) return res.status(404).send('Section non trouvée');
  sections[index].name = req.body.name;
  await writeJson(sectionsFile, sections);
  res.json(sections[index]);
});

app.delete('/sections/:id', async (req, res) => {
  let sections = await readJson(sectionsFile);
  sections = sections.filter(s => s.id !== req.params.id);
  await writeJson(sectionsFile, sections);
  res.sendStatus(204);
});

// --- Products ---
app.get('/products', async (req, res) => res.json(await readJson(productsFile)));

app.post('/products', async (req, res) => {
  const products = await readJson(productsFile);
  const newProd = { id: Date.now().toString(), ...req.body };
  products.push(newProd);
  await writeJson(productsFile, products);
  res.json(newProd);
});

app.put('/products/:id', async (req, res) => {
  const products = await readJson(productsFile);
  const index = products.findIndex(p => p.id === req.params.id);
  if(index === -1) return res.status(404).send('Produit non trouvé');
  products[index] = { ...products[index], ...req.body };
  await writeJson(productsFile, products);
  res.json(products[index]);
});

app.delete('/products/:id', async (req, res) => {
  let products = await readJson(productsFile);
  products = products.filter(p => p.id !== req.params.id);
  await writeJson(productsFile, products);
  res.sendStatus(204);
});

// --- Start server ---
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
