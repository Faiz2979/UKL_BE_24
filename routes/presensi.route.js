const presensiController = require('../controllers/presensi.controller');
const {authorize} = require('../controllers/auth.controller');

const express = require('express');
const app = express();
app.use(express.json());

app.post('/', presensiController.Presensi);
app.get('/history/:IDuser',[authorize], presensiController.findByID);
app.get('/summary/:IDuser',[authorize], presensiController.Summary);
app.post('/analysis',[authorize], presensiController.Analysis);
module.exports = app;

