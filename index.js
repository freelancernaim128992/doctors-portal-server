const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors');
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser');
require('dotenv').config()

// connect mongodb database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ar51s.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// connect cors and body-parser
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('doctors'))
app.use(fileUpload())

// Root File
app.get('/', (req, res) => {
    res.send('Hello World!')
})


// Send Data in Database
client.connect(err => {
    const appointmentsCollection = client.db(process.env.DB_NAME).collection('appointments');
    const doctorsCollection = client.db(process.env.DB_NAME).collection('doctors');
    app.post('/addAppointment', (req, res) => {
        const appointment = req.body;
        appointmentsCollection.insertOne(appointment)
            .then(result => {
                res.send(result.acknowledged)
            })
    })
    app.post('/appointmentsByDate', (req, res) => {
        const date = req.body.date;
        const email = req.body.email;
        doctorsCollection.find({email: email})
        .toArray((err,doctor) => {
            const filter = {date: date};
            if(doctor.length === 0){
                filter.email = email;
            }
            appointmentsCollection.find(filter)
            .toArray((err,document) => {
                res.send(document)
            })
        })
    })
    app.get('/appointments', (req, res) => {
        appointmentsCollection.find({})
        .toArray((err, document) => {
            res.send(document)
        })
    })
    app.post('/AddADoctor', (req,res) => {
        const file = req.files.file;
        const email = req.body.email;
        const name = req.body.name;
        const phone = req.body.phone;
        const newImage = file.data;
        const encImage = newImage.toString('base64');
        const image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImage, 'base64')
        }
        const allDoctorInfo = {name, email, phone, image}
        doctorsCollection.insertOne(allDoctorInfo)
        .then(result => {
            res.send(result.acknowledged)
        })
    })
    app.get('/doctors', (req,res) => {
        doctorsCollection.find({})
        .toArray((err, document) => {
            res.send(document)
        })
    })

    app.post('/isDoctor', (req, res) => {
        const email = req.body.email;
        doctorsCollection.find({email: email})
        .toArray((err,doctor) => {
            res.send(doctor.length > 0)
        })
    })
});


// Server Port
const port = 4000;
app.listen(process.env.PORT || port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})