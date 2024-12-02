const modelUser = require('../models/index').user;
const modelKehadiran = require('../models/index').kehadiran;
const Op = require('sequelize').Op;
const hash = require('md5');
const kehadiran = require('../models/kehadiran');

const formattedDate = (date) => {
    let today = new Date(date);
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    return yyyy + '-' + mm + '-' + dd;
}

const formattedTime = (date) => {
    let today = new Date(date);
    let hh = String(today.getHours()).padStart(2, '0');
    let mm = String(today.getMinutes()).padStart(2, '0');
    let ss = String(today.getSeconds()).padStart(2, '0');
    return hh + ':' + mm + ':' + ss;
}


exports.Presensi = async (request, response) => {
    let dataUser = {
        IDuser: request.body.IDuser,
        date: formattedDate(new Date()),
        time: formattedTime(new Date()),
        status: request.body.status,
        createdAt: new Date(),
        updatedAt: new Date()
    }
    modelKehadiran.create(dataUser)
        .then(result => {
            return response.json({
                success: true,
                data: result,
                message: "Presensi berhasil"
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                data: error,
                message: "Presensi gagal"
            })
        })
}


exports.getAllPresensi = async (request, response) => {
    let presensi = await modelKehadiran.findAll();
    return response.json({
        success: true,
        data: presensi,
        message: "Semua presensi berhasil dimuat"
    });
}


exports.findPresensi = async (request, response) => {
    let keyword = request.body.keyword;

    let presensi = await modelKehadiran.findAll({
        where: {
            [Op.or]: { IDuser: { [Op.like]: `%${keyword}%` } },
        }
    });
    return response.json({
        success: true,
        data: presensi,
        message: "Presensi berhasil dimuat"
    });
}


exports.Summary = async (request, response) => {
    let IDuser = request.params.IDuser
    let presensi = await modelKehadiran.findAll({
        where: { IDuser:IDuser}
    });
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpha = 0;
    presensi.forEach(presensi => {
        switch (presensi.status.toUpperCase()) {
            case "HADIR":
                hadir++;
                break;
            case "IZIN":
                izin++;
                break;
            case "SAKIT":
                sakit++;
                break;
            case "ALPHA":
                alpha++;
                break;
        }
    });
    month = new Date().getMonth()+1+"-"+new Date().getFullYear();
    let dataPresensi = {
        IDuser: presensi.IDuser,
        month: month,
        attendance_summary: {
            hadir: hadir,
            izin: izin,
            sakit: sakit,
            alpha: alpha
        }
    };
    return response.json({
        status: "success",
        data: dataPresensi
    });
}



exports.findByID = async (request, response) => {
    let IDuser = request.params.IDuser;
    let presensi = await modelKehadiran.findAll({
        where: {
            IDuser: IDuser
        }
    });

    let dataKehadiran = presensi.map(presensi => {
        return {
            IDkehadiran: presensi.IDkehadiran,
            date: presensi.date,
            time: presensi.time,
            status: presensi.status
        };
    });
    return response.json({
        status: "success",
        data: dataKehadiran
    });
}

exports.Analysis = async (request, response) => {
    let startDate = request.body.startDate;
    let endDate = request.body.endDate;
    let role = request.body.role;

    let presensi = await modelKehadiran.findAll({
        where: {
            date: {
                [Op.between]: [startDate+1, endDate+1]
            }
        },
        include: [{
            model: modelUser,
            where: {
                role: role
            }
        }]
    });

    response.json({
        success: true,
        data: presensi,
        message: "Data presensi berhasil dimuat"
    })
}