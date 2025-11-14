const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// fichiers JSON
const productsFile = './data/products.json';
const sectionsFile = './data/sections.json';

// helpers pour lire et écrire JSON
const readJSON = (file) => JSON.parse(fs.readFileSync(file));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// --- Sections ---
app.get('/api/sections', (req, res) => {
  res.json(readJSON(sectionsFile));
});

app.post('/api/sections', (req, res) => {
  const sections = readJSON(sectionsFile);
  const newSection = { id: Date.now().toString(), name: req.body.name };
  sections.push(newSection);
  writeJSON(sectionsFile, sections);
  res.json(newSection);
});

app.put('/api/sections/:id', (req, res) => {
  const sections = readJSON(sectionsFile);
  const idx = sections.findIndex(s => s.id === req.params.id);
  if(idx === -1) return res.status(404).send('Not found');
  sections[idx].name = req.body.name;
  writeJSON(sectionsFile, sections);
  res.json(sections[idx]);
});

app.delete('/api/sections/:id', (req, res) => {
  let sections = readJSON(sectionsFile);
  sections = sections.filter(s => s.id !== req.params.id);
  writeJSON(sectionsFile, sections);
  res.sendStatus(200);
});

// --- Products ---
app.get('/api/products', (req, res) => {
  res.json(readJSON(productsFile));
});

app.post('/api/products', (req, res) => {
  const products = readJSON(productsFile);
  const newProd = {
    id: Date.now().toString(),
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    sectionId: req.body.sectionId,
    image: req.body.image || null
  };
  products.push(newProd);
  writeJSON(productsFile, products);
  res.json(newProd);
});

app.put('/api/products/:id', (req, res) => {
  const products = readJSON(productsFile);
  const idx = products.findIndex(p => p.id === req.params.id);
  if(idx === -1) return res.status(404).send('Not found');
  products[idx] = {...products[idx], ...req.body};
  writeJSON(productsFile, products);
  res.json(products[idx]);
});

app.delete('/api/products/:id', (req, res) => {
  let products = readJSON(productsFile);
  products = products.filter(p => p.id !== req.params.id);
  writeJSON(productsFile, products);
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
