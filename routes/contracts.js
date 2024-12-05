const express = require('express');
const router = express.Router();
const { calculateInstallments, getLateFees } = require('../controllers/contractsController');
const { createContract, searchContract  } = require('../controllers/contractsController');


router.post('/create', createContract);
router.post('/calculate', calculateInstallments);
router.get('/late-fees/:contractNo', getLateFees);

router.get('/schedule/:kontrakNo', (req, res) => {
    const kontrakNo = req.params.kontrakNo;
  
    const query = `
      SELECT ANGSURAN_KE, ANGSURAN_PER_BULAN, TANGGAL_JATUH_TEMPO
      FROM JADWAL_ANGSURAN
      WHERE KONTRAK_NO = '${kontrakNo}'
    `;
  
    db.query(query, (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });

  // Rute untuk mencari kontrak dan jadwal angsuran berdasarkan KONTRAK_NO atau CLIENT_NAME
router.get('/search', searchContract);

module.exports = router;
