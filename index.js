const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express()
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())




const uri = "mongodb+srv://first-next-app-DB:Qx1AxXaVSdtpn3Uq@cluster0.rw2jx8i.mongodb.net/?appName=Cluster0";

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

    // Database and Collections
    const database = client.db("eventHubDB");
    const eventsCollection = database.collection("events");
    const usersCollection = database.collection("users");

      //All events
     app.get('/api/events', async (req, res) => {
      try {
        const { search, category, limit } = req.query;
        
        let query = {};
        
        // Search by title
        if (search) {
          query.title = { $regex: search, $options: 'i' };
        }
        
        // Filter by category
        if (category && category !== 'all') {
          query.category = category;
        }

        let events;
        if (limit) {
          events = await eventsCollection.find(query).limit(parseInt(limit)).toArray();
        } else {
          events = await eventsCollection.find(query).toArray();
        }

        res.status(200).json({ success: true, data: events });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

     //event details
    app.get('/api/events/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const event = await eventsCollection.findOne(query);

        if (!event) {
          return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.status(200).json({ success: true, data: event });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });


    //events by useremail
    app.get('/api/events/user/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const query = { creatorEmail: email };
        const events = await eventsCollection.find(query).toArray();

        res.status(200).json({ success: true, data: events });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    //adding new event
    app.post('/api/events', async (req, res) => {
      try {
        const eventData = req.body;
        
        // Add timestamp and status
        const newEvent = {
          ...eventData,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'Active'
        };

        const result = await eventsCollection.insertOne(newEvent);

        res.status(201).json({ 
          success: true, 
          message: 'Event created successfully',
          data: { _id: result.insertedId, ...newEvent }
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    //updating event
     app.put('/api/events/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updateData = req.body;
        
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        };

        const result = await eventsCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.status(200).json({ success: true, message: 'Event updated successfully' });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    //deleting event
    app.delete('/api/events/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await eventsCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.status(200).json({ success: true, message: 'Event deleted successfully' });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
