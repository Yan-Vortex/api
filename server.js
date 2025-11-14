// server.js
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Dossier pour stocker les images
const UPLOAD_DIR = "./uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
app.use("/uploads", express.static(UPLOAD_DIR));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// Fichiers JSON
const PRODUCTS_FILE = "./data/products.json";
const SECTIONS_FILE = "./data/sections.json";

// Helpers
function readJSON(file) {
  if (!fs.existsSync(file)) return [];
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
  if (!name) return res.status(400).json({ error: "Nom requis" });

  const sections = readJSON(SECTIONS_FILE);
  const newSection = { id: Date.now(), name };
  sections.push(newSection);
  writeJSON(SECTIONS_FILE, sections);
  res.json(newSection);
});

// Modifier section
app.put("/sections/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name } = req.body;
  const sections = readJSON(SECTIONS_FILE);
  const index = sections.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: "Not found" });
  sections[index].name = name;
  writeJSON(SECTIONS_FILE, sections);
  res.json(sections[index]);
});

// Supprimer section et ses produits
app.delete("/sections/:id", (req, res) => {
  const id = Number(req.params.id);
  let sections = readJSON(SECTIONS_FILE);
  sections = sections.filter(s => s.id !== id);
  writeJSON(SECTIONS_FILE, sections);

  // supprimer les produits de cette section
  let products = readJSON(PRODUCTS_FILE);
  products = products.filter(p => p.sectionId !== id);
  writeJSON(PRODUCTS_FILE, products);

  res.json({ success: true });
});

/* ------------------- PRODUCTS ---------------------- */

// Liste produits
app.get("/products", (req, res) => {
  res.json(readJSON(PRODUCTS_FILE));
});

// Ajouter produit avec image
app.post("/products", upload.single("image"), (req, res) => {
  const { title, price, sectionId, description } = req.body;
  if (!title || !sectionId) return res.status(400).json({ error: "Titre et section requis" });

  let imageUrl = null;
  if (req.file) {
    imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  }

  const products = readJSON(PRODUCTS_FILE);
  const newProduct = {
    id: Date.now(),
    title,
    price: Number(price) || 0,
    sectionId: Number(sectionId),
    description: description || "",
    image: imageUrl
  };
  products.push(newProduct);
  writeJSON(PRODUCTS_FILE, products);
  res.json(newProduct);
});

// Modifier produit (possibilité de changer image)
app.put("/products/:id", upload.single("image"), (req, res) => {
  const id = Number(req.params.id);
  const { title, price, sectionId, description } = req.body;

  const products = readJSON(PRODUCTS_FILE);
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Not found" });

  let imageUrl = products[index].image;
  if (req.file) {
    imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  }

  products[index] = {
    id,
    title,
    price: Number(price) || 0,
    sectionId: Number(sectionId),
    description: description || "",
    image: imageUrl
  };

  writeJSON(PRODUCTS_FILE, products);
  res.json(products[index]);
});

// Supprimer produit
app.delete("/products/:id", (req, res) => {
  const id = Number(req.params.id);
  let products = readJSON(PRODUCTS_FILE);
  products = products.filter(p => p.id !== id);
  writeJSON(PRODUCTS_FILE, products);
  res.json({ success: true });
});

/* ------------------- DÉMARRAGE ---------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API démarrée sur le port " + PORT));
