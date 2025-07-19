const express = require ("express")
const app = express()
const port = process.env.PORT || 3000


const cors = require('cors');
app.use(cors());
app.use(express.json());

require('dotenv').config();
var admin = require("firebase-admin");
var serviceAccount = require("./FIrebaseToken.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});









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




const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedUser = await admin.auth().verifyIdToken(idToken);
    req.user = decodedUser; // ← You can access req.user.email if needed
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(403).json({ message: "Forbidden: Invalid token" });
  }
};






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

app.get('/foodPost-available/:_id',  async (req, res) => {
  const id = req.params._id;
  const query = { _id: new ObjectId(id) };

  const result = await foodItems.findOne(query);

  res.send(result);
});


app.patch('/foodPost-available/:id',verifyToken, async (req, res) => {
  const id = req.params.id;
  const { AdditionalNotes, status } = req.body;

  const filter = { _id: new ObjectId(id) };

  const updateDoc = {
    $set: {
      'foodData.additionalNotes': AdditionalNotes,
      'foodData.status': status,
      'foodData.updatedAt': new Date()
    }
  };

  const result = await foodItems.updateOne(filter, updateDoc);
  res.send(result);
});



app.get('/foodRequest', verifyToken, async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send("Email query parameter is required");
  }

  const result = await foodItems.find({
    "foodData.status": "requested",
    "foodData.donorEmail": email
  }).toArray();

  res.send(result);
});




app.get('/myFoods', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email; // get email from verified token

    // Find food posts where donorEmail matches logged-in user’s email
    const myFoods = await foodItems.find({
      "foodData.donorEmail": userEmail
    }).toArray();

    res.send(myFoods);
  } catch (error) {
    console.error("Error fetching user's foods:", error);
    res.status(500).send("Server error");
  }
});


app.patch('/foodPost-available/:id', verifyToken, async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid food ID" });
  }

  try {
    const food = await foodItems.findOne({ _id: new ObjectId(id) });
    if (!food) return res.status(404).json({ message: "Food not found" });

    if (food.foodData.donorEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: You don't own this food post" });
    }

    // Build update object from request body (only update provided fields)
    const updateFields = {};
    for (const [key, value] of Object.entries(req.body)) {
      updateFields[`foodData.${key}`] = value;
    }
    updateFields['foodData.updatedAt'] = new Date();

    const result = await foodItems.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    res.send(result);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Server error updating food" });
  }
});

// Delete a food post by ID - only if owner
app.delete('/foodPost-available/:id', verifyToken, async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid food ID" });
  }

  try {
    const food = await foodItems.findOne({ _id: new ObjectId(id) });
    if (!food) return res.status(404).json({ message: "Food not found" });

    if (food.foodData.donorEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: You don't own this food post" });
    }

    const result = await foodItems.deleteOne({ _id: new ObjectId(id) });

    res.send({ message: "Food deleted", deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error deleting food" });
  }
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