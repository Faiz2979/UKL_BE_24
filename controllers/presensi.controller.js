const modelUser = require('../models/index').user;
const modelKehadiran = require('../models/index').kehadiran;
const modelGroup = require('../models/index').group;
const { Op } = require('sequelize');

const formattedDate = (date) => {
    let today = new Date(date);
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
};

const formattedTime = (date) => {
    let today = new Date(date);
    let hh = String(today.getHours()).padStart(2, '0');
    let mm = String(today.getMinutes()).padStart(2, '0');
    let ss = String(today.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
};



exports.Presensi = async (request, response) => {
    try {
        const validStatus = ["HADIR", "IZIN", "SAKIT", "ALPHA"];
        const { IDuser, status } = request.body;

        if (!validStatus.includes(status.toUpperCase())) {
            return response.json({
                success: false,
                message: "Status tidak valid (harus HADIR, IZIN, SAKIT, atau ALPHA)"
            });
        }

        const dataUser = {
            IDuser,
            date: formattedDate(new Date()),
            time: formattedTime(new Date()),
            status: status.toUpperCase(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await modelKehadiran.create(dataUser);
        return response.json({
            success: true,
            data: result,
            message: "Presensi berhasil"
        });
    } catch (error) {
        return response.json({
            success: false,
            error: error.message,
            message: "Presensi gagal"
        });
    }
};



exports.getAllPresensi = async (request, response) => {
    try {
        const presensi = await modelKehadiran.findAll();
        return response.json({
            success: true,
            data: presensi,
            message: "Semua presensi berhasil dimuat"
        });
    } catch (error) {
        return response.json({
            success: false,
            error: error.message,
            message: "Gagal memuat presensi"
        });
    }
};



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
        const { IDuser } = request.params;

        const presensi = await modelKehadiran.findAll({
            where: { IDuser }
        });

        if (presensi.length === 0) {
            return response.json({
                success: false,
                message: "Tidak ada data presensi untuk pengguna ini"
            });
        }

        let hadir = 0, izin = 0, sakit = 0, alpha = 0;
        presensi.forEach(p => {
            switch (p.status.toUpperCase()) {
                case "HADIR": hadir++; break;
                case "IZIN": izin++; break;
                case "SAKIT": sakit++; break;
                case "ALPHA": alpha++; break;
            }
        });

        const month = formattedDate(presensi[0].date).slice(0, 7);

        return response.json({
            status: "success",
            data: {
                IDuser,
                month,
                attendance_summary: { hadir, izin, sakit, alpha }
            }
        });
    } catch (error) {
        return response.json({
            success: false,
            error: error.message,
            message: "Gagal menghitung summary"
        });
    }
};




exports.findByID = async (request, response) => {
    try {
        const { IDuser } = request.params;

        const presensi = await modelKehadiran.findAll({
            where: { IDuser }
        });

        if (presensi.length === 0) {
            return response.json({
                success: false,
                message: "Tidak ada data presensi untuk pengguna ini"
            });
        }

        return response.json({
            success: true,
            data: presensi,
            message: "Data presensi berhasil dimuat"
        });
    } catch (error) {
        return response.json({
            success: false,
            error: error.message,
            message: "Gagal memuat data presensi"
        });
    }
};


exports.Analysis = async (request, response) => {
    let { startDate, endDate, group_by } = request.body; // Sesuaikan nama variabel

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
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: modelGroup,
                            attributes: ['nama_group'], // Ambil kolom nama_group
                            where: {
                                nama_group: group_by // Filter berdasarkan nama_group
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
                    start_date: startDate,
                    end_date: endDate
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