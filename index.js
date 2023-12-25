const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const app = express()
const port = 5000

app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Hello World!')
})
// 


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://sakif:hvItr3Wb3oQqCfjK@cluster0.w0ws3zg.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyToken = async(req,res,next)=>{
  const token = req.cookies?.token;
  console.log('from middleware',token)
  if(!token){
    return res.status(401).send({
      message:'not authorized'
    })
  }

  jwt.verify(token,'2aa83640f796c3bb0448c8f90975923f503d8dbeb3d3d56eb0326b0403f0d5e09ff5f6dd4a641cd338a9fef29eac5069b66fe9bcffeba5c3bf9c11c2198176fb',(err,decoded)=>{
    if (err) {
      console.log(err)
      return res.status(401).send({message:'unauthorized'})
    }
    console.log('value in the token',decoded)
    req.user = decoded
    next()
  })

  
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const serviceCollection = client.db('carDoctor').collection('services');
    const bookingCollection = client.db('carDoctor').collection('bookings')


    // 


    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user,'2aa83640f796c3bb0448c8f90975923f503d8dbeb3d3d56eb0326b0403f0d5e09ff5f6dd4a641cd338a9fef29eac5069b66fe9bcffeba5c3bf9c11c2198176fb',{expiresIn: '1h'})
      // console.log(token)
      // res.send(token);
      res
      .cookie('token',token,{
        httpOnly:true,
        secure:false
      })
      .send({success:true})
    })


    app.post('/logout',async(req,res)=>{
      const user = req.body;
      console.log('logging out',user)
      res.clearCookie('token',{maxAge:0}).send({success:true})
    })





    // 

    app.get('/services',async(req,res)=>{
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result)
      console.log(result)
    })

    app.get('/services/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}

      const options = {
        projection:{title:1,price:1,service_id:1},
      };
      const result = await serviceCollection.findOne(query);
      res.send(result)
      console.log(result)
    })


    app.get('/bookings',verifyToken,async(req,res)=>{
      console.log(req.query.email)
      console.log('from valid token',req.user)
      if(req.query.email !== req.user.email){
        return res.status(403).send({message:'forbidden access'})
      }
      // console.log('tok tok token',req.cookies.token)
      let query = {};
      if(req.query?.email){
        query = {email:req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result)
    })



    app.post("/bookings", async (req, res) => {
      const order = req.body;
      console.log(order);
      const result = await bookingCollection.insertOne(order);
      res.send(result);
    });



    app.patch('/bookings/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id:new ObjectId(id)}
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updateDoc = {
        $set:{
          status:updatedBooking.status
        },
      }
      const result=  await bookingCollection.updateOne(filter,updateDoc);
        res.send(result)
      
    })


    app.delete("/bookings/:id",async(req,res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)};
      const result = await bookingCollection.deleteOne(query);
      console.log(result)
      res.send(result)
    })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})