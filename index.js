var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cors = require('cors');
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;

var app = express();

app.use(cors());
app.use(express.json());

var connection = "mongodb+srv://yuvikagupta1121:Yuvika123@cluster.isrmm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster";

var users;
var db;
var posts;

MongoClient.connect(connection).then((succ) => {
    console.log("db connected");
    db = succ.db("mydatabase");
    users = db.collection("users");
    posts = db.collection("posts");
})

app.post("/addnewuser", (req, res) => {
    db.collection("users").insertOne(req.body).then((succ) => {
        res.send(succ);
    })
})

app.post("/login", (req, res) => {
    db.collection("users").findOne(req.body).then((succ) => {
        res.send(succ);
    })
})

app.post("/logincheck", (req, res) => {
    db.collection("users").findOne({
        _id: new mongodb.ObjectId(req.body.Id)
    }).then((succ) => {
        res.send(succ);
    })
})

// Login page ends

app.post("/submitposts", (req, res) => {
    db.collection("posts").insertOne(req.body).then((succ) => {
        res.send(succ);
    })
})

app.post("/fetchallposts", (req, res) => {
    db.collection("posts").find().toArray().then((succ) => {
        res.send(succ);
    })
})

app.post("/fetchposts", (req, res) => {
    // console.log(req.body.Id);

    db.collection("posts").find({
        Id: req.body.Id
    }).toArray().then((succ) => {
        res.send(succ);
        // console.log(succ)
    })
})

app.post("/fetchprofile", (req, res) => {
    db.collection("posts").find().then((succ) => {
        res.send(succ.data);
    })
})

app.post("/deleteposts", (req, res) => {
    db.collection("posts").deleteOne({
        _id: new mongodb.ObjectId(req.body.Id)
    }).then((succ) => {
        res.send(succ);
    })
})

app.post("/fetchuserprofile", (req, res) => {
    // console.log(req.body.Id);
    db.collection("users").findOne({
        _id: new mongodb.ObjectId(req.body.Id)
    }).then((succ) => {
        // console.log(succ);
        res.send(succ);
    })
})

app.post("/fetchotherusers", (req, res) => {
    db.collection("users").find().toArray().then((succ) => {
        res.send(succ);
        console.log(succ);
    })
});


app.post("/fetchusers", (req, res) => {
    db.collection("users").find().toArray().then((succ) => {
        res.send(succ)
    })
})

app.post("/send-request", (req, res) => {
    db.collection("friendRequests").findOne({
        $or: [
            {
                senderId: req.body.senderId,
                receiverId: req.body.receiverId
            },
            {
                senderId: req.body.receiverId,
                receiverId: req.body.senderId
            },
        ]
    }).then((existingRequest) => {
        if (existingRequest) {
            res.send("Request already sent");
        } else {
            db.collection("friendRequests").insertOne({
                senderId: req.body.senderId,
                receiverId: req.body.receiverId,
                status: "pending"
            }).then(() => res.send("Friend request sent successfully"));
        }
    });
});

app.post("/checkusersrequest", (req, res) => {
    db.collection("friendRequests").findOne({
        $or: [
            {
                senderId: req.body.senderId,
                receiverId: req.body.receiverId
            },
            {
                senderId: req.body.receiverId,
                receiverId: req.body.senderId
            },
        ]
    }).then((existingRequest) => {
        if (existingRequest) {
            res.send({ Message: "Request already sent", RequestDetails: existingRequest });
        } else {
            res.send({ Message: "Not Sent" });
        }
    });
});

app.post("/cancelfriendrequest", (req, res) => {
    db.collection("friendRequests").deleteOne({
        _id: new mongodb.ObjectId(req.body.Id)
    }).then((succ) => {
        res.send("okk");
    })
})

app.post("/acceptfriendrequest", (req, res) => {
    db.collection("friendRequests").updateOne(
        {
            _id: new mongodb.ObjectId(req.body.Id)
        },
        {
            $set: {
                status: "approved"
            }
        }
    ).then((succ) => {
        res.send("okk");
    })
})

app.post("/viewprofile", (req, res) => {
    db.collection("users").findOne({
        _id: new mongodb.ObjectId(req.body.Id)
    }).then((succ) => {
        res.send(succ);
    })
})

app.post("/fetchfriendspost", (req, res) => {
    db.collection("posts").find({
        Id: req.body.Id
    }).toArray().then((succc) => {
        res.send(succc)
        // console.log(req.body.Id);

    })
})


app.post("/fetchfriendlist", async (req, res) => {
    try {
        const userId = req.body.Id;

        // Fetch all approved friend requests
        const friendRequests = await db.collection("friendRequests").find({
            status: "approved",
            $or: [{ senderId: userId }, { receiverId: userId }]
        }).toArray();

        // Extract the friend IDs (excluding the user's own ID)
        const friendIds = friendRequests.map(row =>
            row.senderId === userId ? row.receiverId : row.senderId
        );

        // Fetch user details for each friend using Promise.all()
        const friends = await Promise.all(
            friendIds.map(id => db.collection("users").findOne({ _id: new mongodb.ObjectId(id) }))
        );

        // Send the result to the frontend
        res.send(friends);
    } catch (error) {
        console.error("Error fetching friend list:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

app.get("/searchvalue", (req, res) => {
    console.log(req.query.Name);

    db.collection("users").find({
        Name: req.query.Name
    }).toArray().then((succ) => {
        console.log(succ);
        res.send(succ)
    })
})

app.post("/submitprofilepic", (req, res) => {
    db.collection("profilepic").insertOne(req.body).then((succ) => {
        res.send("ok");
    })
})

app.post("/fetchpic", (req, res) => {
    // console.log(req.body.Id);
    db.collection("profilepic").find({ Id: req.body.Id }).sort({ Datetime: -1 }).limit(1).toArray().then((succ) => {
        // console.log(succ);
        // res.send("ok");
        if (succ) {
            res.send(succ);
        } else {
            res.send({ Url: "" });
        }
    })
})

app.post("/deletefriend", (req, res) => {

    db.collection("friendRequests").deleteOne({
        $or: [
            {
                senderId: req.body.senderId,
                receiverId: req.body.receiverId
            },
            {
                senderId: req.body.receiverId,
                receiverId: req.body.senderId
            },
        ]
    }).then((succ) => {
        if (succ.deletedCount == 1) {
            res.send("okk");
        }
    });
})

app.post("/viewmessageprofile", (req, res) => {

    db.collection("friendRequests").findOne({
        $or: [
            {
                senderId: req.body.senderId,
                receiverId: req.body.receiverId
            },
            {
                senderId: req.body.receiverId,
                receiverId: req.body.senderId
            },
        ]
    }).then((succ) => {

        res.send(succ);

    });
})

app.post("/sendmessage", (req, res) => {
    db.collection("Messages").insertOne(req.body).then((succ) => {
        res.send(succ);
    })
})

app.post("/getmessage", (req, res) => {
    db.collection("Messages").find(req.body).toArray().then((succ) => {
        res.send(succ);
    })
})

app.post("/fetchloginuser", (req, res) => {
    db.collection("users").findOne({
        _id: new mongodb.ObjectId(req.body.Id)
    }).then((succ) => {
        res.send(succ)
        console.log();
        
    })
})

app.listen(1000, (req, res) => {
    console.log("Server Started");
})