const express = require ("express")
const app = express()
const port = process.env.PORT || 3000


const cors = require('cors');
app.use(cors());
app.use(express.json());

require('dotenv').config();



















app.get("/", (req,res) =>{

    res.send("FOOD SHARING SERVER IS RUNNING")


} )


app.listen( port, ()=>{

    console.log( `example app listening on port ${port} ` )

} )