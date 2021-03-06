/*********
CAT SCHEMA
*********/
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Owner = require('./owner');

var CatSchema = new Schema({
  petName: String,
  pictureUrl: String,
  dateLastSeen: String,
  locationLastSeen: String,
  email: String,
  owners: [Owner.schema]
});

/*EXPORTING CAT SCHEMA TO MONGOOSE AND INDEX.JS MODEL*/
var Cat = mongoose.model('Cat', CatSchema);
module.exports = Cat;
