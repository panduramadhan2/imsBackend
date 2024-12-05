## Menjalankan code saya

instal npm dulu

```bash
npm install
```
jalankan script
```bash
npm run dev
````
buat sql database dengan

```bash
CREATE TABLE KONTRAK (
    KONTRAK_NO VARCHAR(10) PRIMARY KEY,
    CLIENT_NAME VARCHAR(50),
    OTR DECIMAL(15,2)
);

CREATE TABLE JADWAL_ANGSURAN (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    KONTRAK_NO VARCHAR(10),
    ANGSURAN_KE INT,
    ANGSURAN_PER_BULAN DECIMAL(15,2),
    TANGGAL_JATUH_TEMPO DATE,
    FOREIGN KEY (KONTRAK_NO) REFERENCES KONTRAK(KONTRAK_NO)
);
```