const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const contractRoutes = require('./routes/contracts');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/contracts', contractRoutes);

app.listen(5000, () => console.log('Server running on port 5000'));
