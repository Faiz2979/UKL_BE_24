const groupController = require('../controllers/group.controller');
const express = require('express');
const {authorize} = require('../controllers/auth.controller');
const app = express();


app.post('/',[authorize], groupController.addGroup);
app.delete('/:IDgroup',[authorize], groupController.deleteGroup);

module.exports = app;