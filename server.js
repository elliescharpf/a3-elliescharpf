const express = require("express"),
    fs = require("fs"),
    mime = require("mime"),
    { MongoClient, ObjectId, ServerApiVersion } = require("mongodb"),
    app = express(),
    dir = "public/",
    port = 3000;
const req = require("express/lib/request");
const path = require("node:path");

// MongoDB connection URL
const uri = "mongodb+srv://elscharpf:mongodbatlasspassword@budgettracker.pk47g.mongodb.net/?retryWrites=true&w=majority&appName=BudgetTracker";
const dbName = "BudgetTracker";

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
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);

// MongoDB client instance
let db, transactionsCollection, usersCollection;

// Connect to MongoDB
MongoClient.connect(uri)
    .then(client => {
        console.log("Connected to MongoDB");
        db = client.db(dbName);
        transactionsCollection = db.collection("transactions");
        usersCollection = db.collection("users");

        // Find or create "testuser"
        usersCollection.findOne({ username: "testuser" }).then((user) => {
            if (!user) {
                usersCollection.insertOne({
                    username: "testuser",
                    password: "123",
                });
                console.log("testuser added");
            }

            // Find or create "testuser2"
            usersCollection.findOne({ username: "testuser2" }).then((user) => {
                if (!user) {
                    usersCollection.insertOne({
                        username: "testuser2",
                        password: "123",
                    });
                    console.log("testuser2 added");
                }
            })
                .catch(err => console.error("Failed to connect to MongoDB:", err)); // Catching errors for "testuser2"
        })
            .catch(err => console.error("Failed to connect to MongoDB:", err)); // Catching errors for "testuser"

        // Serve static files from the "public" directory
        app.use(express.static('public'));

    })
    .catch(err => console.error("Failed to connect to MongoDB:", err)); // Catching errors for MongoDB connection

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/login.html"));
});

app.get("/results", async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: "User not specified" });
    }

    try {
        const transactionsCollection = db.collection("transactions");

        // Fetch transactions only for the logged-in user
        const transactions = await transactionsCollection.find({ username }).toArray();

        res.json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



app.post("/addTransaction", async (req, res) => {
    const { username, yourname, amount, category, date } = req.body;

    if (!username) {
        return res.status(400).json({ error: "User not logged in" });
    }

    const newTransaction = {
        username,
        yourname,
        amount,
        category,
        date: new Date(date),
    };

    try {
        const transactionsCollection = db.collection("transactions");
        await transactionsCollection.insertOne(newTransaction);

        res.status(201).json({ message: "Transaction added" });
    } catch (error) {
        console.error("Error adding transaction:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.patch("/editTransaction/:id", async (req, res) => {
    const transactionId = req.params.id;
    const newAmount = req.body.amount;

    try {
        const result = await transactionsCollection.updateOne(
            { _id: new ObjectId(transactionId) },
            { $set: { amount: newAmount } }
        );

        if (result.modifiedCount === 1) {
            const updatedTransaction = await transactionsCollection.find().toArray();
            res.json({ updatedTransaction });
        } else {
            res.status(404).json({ message: "Transaction not found or not modified" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error updating transaction", error });
    }
});

app.delete("/deleteTransaction/:id", async (req, res) => {
    const transactionId = req.params.id;

    try {
        const deletedTransaction = await transactionsCollection.deleteOne({ _id: new ObjectId(transactionId) });

        if (deletedTransaction.deletedCount === 0) {
            return res.status(404).json({ message: "Transaction not found." });
        }

        res.json({ message: "Transaction deleted!" });
    } catch (err) {
        console.error("Error deleting transaction:", err);
        res.status(500).json({ message: "Error deleting transaction." });
    }
});

// Handle POST request to clear data
app.post("/clear", async (req, res) => {
    try {
        await transactionsCollection.deleteMany({}); // Clear all transactions from MongoDB
        console.log("Data cleared!");
        res.json({ message: "Data cleared!" });
    } catch (err) {
        res.status(500).json({ message: "Error clearing data" });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await usersCollection.findOne({ username });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        res.json({ message: "Login successful", username: user.username });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// app.post("/register", async (req, res) => {
//     const { username, password } = req.body;
//     transactionsCollection = db.collection("transactions");
//     usersCollection = db.collection("users");
//
//     try {
//         const result = await usersCollection.insertOne({ username, password });
//
//         if (result.insertedCount > 0) {
//             return res.status(200).json({ message: "Registration successful" });
//         } else {
//             return res.status(500).json({ message: "Registration failed" });
//         }
//     } catch (error) {
//         console.error("Error registering user:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });

// Start the server
app.listen(process.env.PORT || port, () => {
    console.log(`Server is running on port ${process.env.PORT || port}`);
});
