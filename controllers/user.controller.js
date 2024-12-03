const userModel = require('../models/index').user;
const express = require('express');
const hash = require('md5');
const app = express();
app.use(express.json());
const { Op } = require('sequelize');

exports.addUser = async (request, response) => {
    try {
        let newUser = {
            name: request.body.name,
            role: request.body.role,
            IDgroup: request.body.IDgroup,
            username: request.body.username,
            password: hash(request.body.password), // Hash password
            createdAt: new Date(),
            updatedAt: new Date()
        };

        let result = await userModel.create(newUser);

        let displayUser = {
            IDuser: result.IDuser,
            name: result.name,
            role: result.role,
            username: result.username
        };
        return response.json({
            success: true,
            message: "User has been added",
            data: displayUser
        });
    } catch (error) {
        return response.json({
            success: false,
            data: error.message,
            message: "User cannot be added"
        });
    }
};


exports.findByID = async (request, response) => {
    let IDuser = request.params.IDuser;
    let user = await userModel.findOne({
        where: {
            IDuser: IDuser
        }
    });
    let displayUser= {
        IDuser: user.IDuser,
        name: user.name,
        username:user.username,
        role: user.role
    }
    return response.json({
        status: "success",
        data: displayUser
    });
}


exports.getAllUser = async (request, response) => {
    let users = await userModel.findAll();
    let userData = users.map(user => {
        return {
            IDuser: user.IDuser,
            name: user.name,
            role: user.role
        };
    });

    return response.json({
        success: true,
        data: userData,
        message: "All users have been loaded"
    });
}

exports.findUser = async (request, response) => {
    let keyword = request.body.keyword;

    let users = await userModel.findAll({
        where: {
            [Op.or]: [
                { name: { [Op.like]: `%${keyword}%` } },
                { role: { [Op.like]: `%${keyword}%` } },
                { username: { [Op.like]: `%${keyword}%` } }
            ]
        }
    });
    return response.json({
        success: true,
        data: users,
        message: "Users have been loaded"
    });
}

exports.updateUser = async (request, response) => {
    let dataUser = {
        name: request.body.name,
        role: request.body.role,
        username: request.body.username,
        password: hash(request.body.password),
        updatedAt: new Date()
    }
    
    let IDuser = request.params.IDuser;
    userModel.update(dataUser, {
        where: {
            IDuser: IDuser
        }
    })
        .then(result => {
            return response.json({
                success: true,
                data: dataUser,
                message: "User has been updated"
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                data: error,
                message: "User cannot be updated"
            })
        })
}

exports.deleteUser = async (request, response) => {
    let IDuser = request.params.IDuser;
    userModel.destroy({
        where: {
            IDuser: IDuser
        }
    })
        .then(result => {
            return response.json({
                success: true,
                data: result,
                message: "User has been deleted"
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                data: error,
                message: "User cannot be deleted"
            })
        })
}