    const groupModel = require('../models/index').group;
    const express = require('express');
    const app = express();
    app.use(express.json());
    const { Op } = require('sequelize');

    // Tambah Group
    exports.addGroup = async (request, response) => {
    try {
        let newGroup = {
        nama_group: request.body.name, // Sesuaikan nama properti dengan model
        createdAt: new Date(),
        updatedAt: new Date()
        };

        let result = await groupModel.create(newGroup);

        let displayGroup = {
        IDgroup: result.IDgroup, // Asumsi IDgroup dikembalikan dari DB
        name: result.nama_group
        };

        return response.json({
        success: true,
        message: "Group has been added",
        data: displayGroup
        });
    } catch (error) {
        return response.json({
        success: false,
        data: error.message,
        message: "Group cannot be added"
        });
    }
    };

    // Hapus Group
    exports.deleteGroup = async (request, response) => {
    try {
        let IDgroup = request.params.IDgroup;
        let result = await groupModel.destroy({
        where: { IDgroup: IDgroup }
        });

        return response.json({
        success: true,
        data: result,
        message: "Group has been deleted"
        });
    } catch (error) {
        return response.json({
        success: false,
        data: error.message,
        message: "Group cannot be deleted"
        });
    }
    };
