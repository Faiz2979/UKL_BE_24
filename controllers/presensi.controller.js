const modelUser = require('../models/index').user;
const modelKehadiran = require('../models/index').kehadiran;
const modelGroup = require('../models/index').group;
const { Op } = require('sequelize');



const moment = require('moment');

exports.Presensi = async (request, response) => {
    try {
        const { IDuser, date, time, status } = request.body;

        //Validasi User
        const userExists = await modelUser.findOne({ where: { IDuser } });
        if (!userExists) {
        return response.status(400).json({
        success: false,
        message: "IDuser tidak ditemukan.",
        });
}
        // Validasi waktu
        if (!moment(time, "HH:mm:ss", true).isValid()) {
            return response.status(400).json({
                success: false,
                message: "Invalid time format. Use HH:mm:ss.",
            });
        }

        const dataUser = {
            IDuser,
            date: moment(date, "YYYY-MM-DD").format("YYYY-MM-DD"), // Format date
            time: moment(time, "HH:mm:ss").format("HH:mm:ss"), // Format time
            status,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await modelKehadiran.create(dataUser);

        return response.json({
            success: true,
            data: {
                IDkehadiran: result.IDkehadiran,
                IDuser: result.IDuser,
                date: moment(result.date,"YYYY-MM-DD").format("YYYY-MM-DD"),
                time: result.time,
                status: result.status,
            },
            message: "Presensi berhasil",
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Presensi gagal",
            error: error.message,
        });
    }
};


exports.getAllPresensi = async (request, response) => {
    let presensi = await modelKehadiran.findAll();
    let displayData={
        IDkehadiran: presensi.IDkehadiran,
        date:moment(presensi.date, "YYYY-MM-DD").format("YYYY-MM-DD"),
        time: moment(presensi.time, "HH:mm:ss").format("HH:mm:ss"),
        status:presensi.status
    }
    return response.json({
        success: true,
        data: displayData,
        message: "Semua presensi berhasil dimuat"
    });
}



exports.findPresensi = async (request, response) => {
    try {
        const { keyword } = request.body;

        const presensi = await modelKehadiran.findAll({
            where: {
                [Op.or]: [
                    { IDuser: { [Op.like]: `%${keyword}%` } }
                ]
            }
        });

        return response.json({
            success: true,
            data: presensi,
            message: "Presensi berhasil dimuat"
        });
    } catch (error) {
        return response.json({
            success: false,
            error: error.message,
            message: "Gagal memuat presensi"
        });
    }
};



exports.Summary = async (request, response) => {
    try {
        const { IDuser, month } = request.params; // Ambil IDuser dan bulan dari parameter

        // Validasi parameter bulan
        if (!moment(month, "MM", true).isValid()) {
            return response.status(400).json({
                success: false,
                message: "Format bulan tidak valid. Gunakan format MM (contoh: 01 untuk Januari).",
            });
        }

        // Ambil range tanggal awal dan akhir bulan berdasarkan parameter
        const startDate = moment().month(month - 1).startOf('month').format("YYYY-MM-DD");
        const endDate = moment().month(month - 1).endOf('month').format("YYYY-MM-DD");

        // Ambil data presensi berdasarkan IDuser dan rentang tanggal
        const presensi = await modelKehadiran.findAll({
            where: {
                IDuser,
                date: {
                    [Op.between]: [startDate, endDate],
                },
            },
        });

        if (presensi.length === 0) {
            return response.json({
                success: false,
                message: `Tidak ada data presensi untuk bulan ${moment(startDate).format("MMMM YYYY")}`,
            });
        }

        // Proses data untuk mendapatkan summary
        let hadir = 0, izin = 0, sakit = 0, alpha = 0;
        presensi.forEach((p) => {
            switch (p.status.toUpperCase()) {
                case "HADIR": hadir++; break;
                case "IZIN": izin++; break;
                case "SAKIT": sakit++; break;
                case "ALPHA": alpha++; break;
            }
        });

        const monthName = moment(startDate).format("MMMM YYYY");

        return response.json({
            status: "success",
            data: {
                IDuser,
                month: monthName,
                attendance_summary: { hadir, izin, sakit, alpha },
            },
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            error: error.message,
            message: "Gagal menghitung summary",
        });
    }
};





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
            date: moment(presensi.date, "YYYY-MM-DD").format("YYYY-MM-DD"),
            time: moment(presensi.time, "HH:mm:ss").format("HH:mm:ss"),
            status: presensi.status
        };
    });
    return response.json({
        status: "success",
        data: dataKehadiran
    });
}


exports.Analysis = async (request, response) => {
    let { startDate, endDate, nama_group } = request.body; // Sesuaikan nama variabel

    try {
        // Ambil data presensi dengan relasi user dan grup
        let presensi = await modelKehadiran.findAll({
            where: {
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: modelUser,
                    attributes: ['IDuser', 'name'],
                    include: [
                        {
                            model: modelGroup,
                            attributes: ['nama_group'], // Ambil kolom nama_group
                            where: {
                                nama_group: nama_group // Filter berdasarkan nama_group
                            }
                        }
                    ]
                }
            ]
        });

        // Proses data untuk perhitungan
        let groupedAnalysis = presensi.reduce((result, item) => {
            let groupName = item.user.group.nama_group || "Unknown";

            if (!result[groupName]) {
                result[groupName] = {
                    group: groupName,
                    total_users: 0,
                    attendance_rate: {
                        hadir_percentage: 0,
                        izin_percentage: 0,
                        sakit_percentage: 0,
                        alpha_percentage: 0
                    },
                    total_attendance: {
                        hadir: 0,
                        izin: 0,
                        sakit: 0,
                        alpha: 0
                    }
                };
            }

            // Update data kehadiran
            result[groupName].total_users += 1;
            result[groupName].total_attendance.hadir += item.status === "hadir" ? 1 : 0;
            result[groupName].total_attendance.izin += item.status === "izin" ? 1 : 0;
            result[groupName].total_attendance.sakit += item.status === "sakit" ? 1 : 0;
            result[groupName].total_attendance.alpha += item.status === "alpha" ? 1 : 0;

            // Hitung persentase
            let total = result[groupName].total_users;
            result[groupName].attendance_rate.hadir_percentage =
                (result[groupName].total_attendance.hadir / total) * 100;
            result[groupName].attendance_rate.izin_percentage =
                (result[groupName].total_attendance.izin / total) * 100;
            result[groupName].attendance_rate.sakit_percentage =
                (result[groupName].total_attendance.sakit / total) * 100;
            result[groupName].attendance_rate.alpha_percentage =
                (result[groupName].total_attendance.alpha / total) * 100;

            return result;
        }, {});

        // Format ulang data menjadi array
        groupedAnalysis = Object.values(groupedAnalysis);

        // Respons sesuai format
        let responseData = {
            status: "success",
            data: {
                analysis_period: {
                    start_date: moment(startDate, "YYYY-MM-DD").format("YYYY-MM-DD"),
                    end_date: moment(endDate, "YYYY-MM-DD").format("YYYY-MM-DD")
                },
                grouped_analysis: groupedAnalysis
            }
        };

        response.json(responseData);
    } catch (error) {
        console.error(error);
        response.status(500).json({
            status: "error",
            message: "Internal Server Error"
        });
    }
};