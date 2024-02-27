const mongoose = require('mongoose');

const parfumeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genre: { type: String, required: true },
  price: { type: Number, required: true },
  creationDate: { type: Date, default: Date.now },
  deletionDate: { type: Date, default: null },
  image: { type: String, required: true },
});


const Parfume = mongoose.model('Parfume', parfumeSchema);

module.exports = Parfume;