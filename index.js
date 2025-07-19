const express = require ("express")
const app = express()
const port = process.env.PORT || 3000


const cors = require('cors');
app.use(cors());
app.use(express.json());

require('dotenv').config();









const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@clusterabir.tkzrtc8.mongodb.net/?retryWrites=true&w=majority&appName=ClusterAbir`;
console.log(process.env.DB_USER)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const foodItems = client.db("FoodShare").collection("FoodCollection");

    app.post('/foodPost' , async(req,res)=>{
        const newFood = req.body;
        const result = await foodItems.insertOne(newFood);


        res.send(result)
    } )

    app.get('/foodPost', async(req,res)=>{
  const result = await foodItems.find({  }).toArray();
  res.send(result);
} )

    app.get('/foodPost-available', async (req, res) => {
    const result = await foodItems.find({ "foodData.status" :"available" }).sort( { "foodData.expireDate": 1 } ).toArray()

    res.send(result);
});

app.get('/foodPost-available/:_id', async (req, res) => {
  const id = req.params._id;
  const query = { _id: new ObjectId(id) };

  const result = await foodItems.findOne(query);

  res.send(result);
});



app.patch('/foodPost-available/:id', async (req, res) => {
  const id = req.params.id;
  const { status, note, updatedAt } = req.body;

  const filter = { _id: new ObjectId(id) };

  const updateDoc = {
    $set: {
      'foodData.status': status,
      'foodData.notes': note,
      'foodData.updatedAt': updatedAt || new Date()
    }
  };

  const result = await foodItems.updateOne(filter, updateDoc);
  res.send(result);
});





  
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);










app.get("/", (req,res) =>{

    res.send("FOOD SHARING SERVER IS RUNNING")


} )


app.listen( port, ()=>{

    console.log( `example app listening on port ${port} ` )

} )