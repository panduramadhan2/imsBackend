const db = require("../models/db");

exports.calculateInstallments = (req, res) => {
  const { otr, dp, duration } = req.body; // Durasi dalam bulan
  const dpAmount = otr * (dp / 100); // Menghitung Down Payment
  const loanAmount = otr - dpAmount; // Total pinjaman setelah DP

  // Menentukan bunga berdasarkan durasi
  let interestRate = 0;
  if (duration <= 12) {
    interestRate = 0.12; // 12% bunga
  } else if (duration > 12 && duration <= 24) {
    interestRate = 0.14; // 14% bunga
  } else if (duration > 24) {
    interestRate = 0.165; // 16.5% bunga
  }

  // Membatasi bunga menjadi 2 desimal
  const formattedInterestRate = (interestRate * 100).toFixed(2); // Dalam persen dan dibatasi 2 desimal

  // Menghitung total pinjaman dengan bunga
  const totalLoanWithInterest = loanAmount + loanAmount * interestRate;

  // Menghitung angsuran per bulan
  const monthlyInstallment = totalLoanWithInterest / duration;

  res.json({
    dpAmount,
    totalLoanWithInterest,
    monthlyInstallment,
    interestRate: formattedInterestRate, // Bunga dalam persen, dibatasi 2 desimal
  });
};

exports.getLateFees = (req, res) => {
  const contractNo = req.params.contractNo;
  const overdueDate = "2024-08-14";

  const query = `
    SELECT SUM(ANGSURAN_PER_BULAN) AS unpaid, 
           SUM(ANGSURAN_PER_BULAN) * 0.001 * DATEDIFF('${overdueDate}', TANGGAL_JATUH_TEMPO) AS penalty 
    FROM JADWAL_ANGSURAN 
    WHERE KONTRAK_NO = ? AND TANGGAL_JATUH_TEMPO <= ? 
      AND ANGSURAN_KE >= 5;
  `;

  db.query(query, [contractNo, overdueDate], (err, results) => {
    if (err) throw err;
    res.json(results[0]);
  });
};

exports.createContract = (req, res) => {
  const { otr, dp, duration, kontrakNo, clientName, startDate } = req.body;

  const dpAmount = otr * (dp / 100);
  const loanAmount = otr - dpAmount;

  let interestRate = 0;
  if (duration <= 12) {
    interestRate = 0.12; // 12% bunga
  } else if (duration > 12 && duration <= 24) {
    interestRate = 0.14; // 14% bunga
  } else {
    interestRate = 0.165; // 16.5% bunga untuk durasi > 24 bulan
  }

  // Membatasi bunga menjadi dua desimal
  const formattedInterestRate = (interestRate * 100).toFixed(1); // Format bunga dengan satu angka desimal

  const totalLoanWithInterest = loanAmount + loanAmount * interestRate;
  const monthlyInstallment = totalLoanWithInterest / duration;

  // Menyimpan kontrak ke database
  const contractQuery = `
    INSERT INTO KONTRAK (KONTRAK_NO, CLIENT_NAME, OTR)
    VALUES ('${kontrakNo}', '${clientName}', ${otr})
  `;

  db.query(contractQuery, (err, result) => {
    if (err) throw err;

    // Menyimpan jadwal angsuran
    let currentDate = new Date(startDate);
    for (let i = 1; i <= duration; i++) {
      currentDate.setMonth(currentDate.getMonth() + 1); // Menambah 1 bulan untuk setiap angsuran
      const dueDate = currentDate.toISOString().split("T")[0]; // Mendapatkan tanggal dalam format YYYY-MM-DD

      const scheduleQuery = `
        INSERT INTO JADWAL_ANGSURAN (KONTRAK_NO, ANGSURAN_KE, ANGSURAN_PER_BULAN, TANGGAL_JATUH_TEMPO)
        VALUES ('${kontrakNo}', ${i}, ${monthlyInstallment}, '${dueDate}')
      `;

      db.query(scheduleQuery, (err) => {
        if (err) throw err;
      });
    }

    // Mengirimkan hasil ke frontend
    res.json({
      message: "Kontrak dan jadwal angsuran berhasil dibuat!",
      totalLoanWithInterest,
      monthlyInstallment,
      interestRate: formattedInterestRate, // Mengirimkan bunga dengan satu angka desimal
    });
  });
};


// Fungsi untuk mencari kontrak dan jadwal angsuran
exports.searchContract = (req, res) => {
  const { kontrakNo, clientName } = req.query;

  // Validasi panjang input pencarian
  if (
    (kontrakNo && kontrakNo.length < 2) ||
    (clientName && clientName.length < 2)
  ) {
    return res.status(400).json({
      message: "Harap masukkan lebih dari 1 karakter untuk pencarian",
    });
  }

  // Menyiapkan query dasar
  let query = "SELECT * FROM KONTRAK WHERE 1=1";
  let params = [];

  // Menambahkan kondisi pencarian untuk KONTRAK_NO jika ada
  if (kontrakNo) {
    query += " AND KONTRAK_NO LIKE ?";
    params.push(`%${kontrakNo}%`); // Menambahkan parameter untuk KONTRAK_NO
  }

  // Menambahkan kondisi pencarian untuk CLIENT_NAME jika ada
  if (clientName) {
    query += " AND CLIENT_NAME LIKE ?";
    params.push(`%${clientName}%`); // Menambahkan parameter untuk CLIENT_NAME
  }

  // Menjalankan query untuk mencari kontrak
  db.query(query, params, (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.status(404).json({ message: "Kontrak tidak ditemukan" });
    }

    const kontrakNo = results[0].KONTRAK_NO;
    const scheduleQuery = `
      SELECT ANGSURAN_KE, ANGSURAN_PER_BULAN, DATE_FORMAT(TANGGAL_JATUH_TEMPO, '%Y-%m-%d') AS TANGGAL_JATUH_TEMPO
      FROM JADWAL_ANGSURAN
      WHERE KONTRAK_NO = ?
    `;

    // Menjalankan query untuk mendapatkan jadwal angsuran
    db.query(scheduleQuery, [kontrakNo], (err, schedule) => {
      if (err) throw err;
      res.json({ kontrak: results[0], schedule });
    });
  });
};
