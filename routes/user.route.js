const userController = require('../controllers/user.controller');
const express = require('express');
const {authorize} = require('../controllers/auth.controller');
const app = express();

app.post('/',[authorize], userController.addUser);
app.get('/',[authorize], userController.getAllUser);
app.post('/find',[authorize], userController.findUser);
app.put('/:IDuser',[authorize], userController.updateUser);
app.delete('/:IDuser',[authorize] ,userController.deleteUser);
app.get('/:IDuser',[authorize] ,userController.findByID);

module.exports = app;