// server.js
if (req.file) {
imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
} else if (body.image) {
imageUrl = body.image; // allow client to send dataURL or existing url
}


const products = readJSON(PRODUCTS_FILE);
const newProduct = {
id: Date.now(),
name: title,
price,
sectionId,
description,
image: imageUrl
};
products.push(newProduct);
writeJSON(PRODUCTS_FILE, products);
res.json(newProduct);
});


app.put('/products/:id', upload.single('image'), (req, res) => {
const id = Number(req.params.id);
const body = req.body || {};
const title = body.title || body.name;
const price = Number(body.price) || 0;
const sectionId = Number(body.sectionId) || null;
const description = body.description || '';


const products = readJSON(PRODUCTS_FILE);
const index = products.findIndex(p => p.id === id);
if (index === -1) return res.status(404).json({ error: 'Not found' });


let imageUrl = products[index].image;
if (req.file) {
imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
} else if (body.image) {
imageUrl = body.image;
}


products[index] = {
id,
name: title,
price,
sectionId,
description,
image: imageUrl
};
writeJSON(PRODUCTS_FILE, products);
res.json(products[index]);
});


app.delete('/products/:id', (req, res) => {
const id = Number(req.params.id);
let products = readJSON(PRODUCTS_FILE);
products = products.filter(p => p.id !== id);
writeJSON(PRODUCTS_FILE, products);
res.json({ success: true });
});


/* ------------------- START ---------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API started on port ${PORT}`));
