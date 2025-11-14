const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const ARTICLES_FILE = "./data/products.json";
const SECTIONS_FILE = "./data/sections.json";

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* ------------------- SECTIONS ---------------------- */

// Liste des sections
app.get("/sections", (req, res) => {
  res.json(readJSON(SECTIONS_FILE));
});

// Création section
app.post("/sections", (req, res) => {
  const { name } = req.body;
  const sections = readJSON(SECTIONS_FILE);

  const newSection = {
    id: Date.now(),
    name
  };

  sections.push(newSection);
  writeJSON(SECTIONS_FILE, sections);

  res.json(newSection);
});

// Suppression section
app.delete("/sections/:id", (req, res) => {
  const id = Number(req.params.id);
  let sections = readJSON(SECTIONS_FILE);

  sections = sections.filter(s => s.id !== id);
  writeJSON(SECTIONS_FILE, sections);

  res.json({ success: true });
});

/* ------------------- ARTICLES ---------------------- */

// Liste articles
app.get("/products", (req, res) => {
  res.json(readJSON(ARTICLES_FILE));
});

// Ajouter article
app.post("/products", (req, res) => {
  const { title, price, image, sectionId } = req.body;

  const products = readJSON(ARTICLES_FILE);

  const newArticle = {
    id: Date.now(),
    title,
    price,
    image,
    sectionId
  };

  products.push(newArticle);
  writeJSON(ARTICLES_FILE, products);

  res.json(newArticle);
});

// Modifier article
app.put("/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, price, image, sectionId } = req.body;

  const products = readJSON(ARTICLES_FILE);

  const index = products.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ error: "Not found" });

  products[index] = { id, title, price, image, sectionId };
  writeJSON(ARTICLES_FILE, products);

  res.json(products[index]);
});

// Supprimer article
app.delete("/products/:id", (req, res) => {
  const id = Number(req.params.id);
  let products = readJSON(ARTICLES_FILE);

  products = products.filter(a => a.id !== id);

  writeJSON(ARTICLES_FILE, products);
  res.json({ success: true });
});

/* ------------------- DÉMARRAGE ---------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API démarrée sur le port " + PORT));
