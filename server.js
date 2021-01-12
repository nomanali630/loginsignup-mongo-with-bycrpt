var express = require("express")
var cors = require("cors")
var morgan = require("morgan")
var bodyParser = require("body-parser")
var mongoose = require("mongoose")
var bcrypt = require("bcrypt-inzi")
var jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
var path = require("path");

var SERVER_SECRET = process.env.SECRET || "1234";

let dbURI = "mongodb+srv://nomanali:03112515630@cluster0.03qvu.mongodb.net/first?retryWrites=true&w=majority";

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on("connected", function () {
    console.log("mongoose is connected");
});
mongoose.connection.on("disconnected", function () {
    console.log("mongoose is disconnected");
    process.exit(1);
});
mongoose.connection.on("error", function (err) {
    console.log("mongoose connection error", err);
});
process.on("SIGINT", function () {
    console.log("app is terminating");
    mongoose.connection.close(function () {
        console.log("mongoose default connection close");
        process.close(0);
    });
});
var userSchema = new mongoose.Schema({
    "name": String,
    "email": String,
    "password": String,
    "phone": String,
    "gender": String,
    "createdOn": { "type": Date, "default": Date.now },
    "activeSince": Date,
});
var userModel = mongoose.model("users", userSchema);

var app = express();
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());
app.use(cookieParser());
app.use("/", express.static(path.resolve(path.join(__dirname, "public"))))

app.post("/signup", function (req, res, next) {
    if (!req.body.name || !req.body.email
        || !req.body.password || !req.body.gender) {
        res.status(403).send(`
           please send name ,email ,password, gender and phone in json body.
            {
                name:noman ali,
                email:hussainkhaan78@gmail.com,
                password:123,
                gender: male,
           }`)
        return;
    }
    userModel.findOne({ email: req.body.email },
        function (err, data) {
            if (!err && !data) {
                bcrypt.stringToHash(req.body.password).then(function (pyaraPass) {
                    var newUser = new userModel({
                        "name": req.body.name,
                        "email": req.body.email,
                        "password": pyaraPass,
                        "phone": req.body.phone,
                        "gender": req.body.gender

                    });
                    newUser.save(function (err, data) {
                        if (!err) {
                            res.send({
                                message: "user agaya"
                            })
                        } else {
                            console.log(err);
                            res.status(500).send({
                                message: "user ne create kiya error " + err
                            });
                        }
                    })
                })
            } else if (err) {
                res.status(500).send({
                    message: "database error"
                })
            } else {
                res.status(409).send({
                    message: "user pehly se mojude hai"
                });
            }
        }



    )
});

app.post("/login", function (req, res, next) {
    if (!req.body.password || !req.body.email) {
        res.status(403).send(`
        please provide email and password in json body
        {
            "email": "hussainkhaan78@gmail.com",
            "password":"123"
        }`)
        return;
    }
    userModel.findOne({ email: req.body.email },
        function (err, user) {
            if (err) {
                res.status(500).send({
                    message: "an error occured" + JSON.stringify(err)
                });
            } else if (user) {
                bcrypt.verifyHash(req.body.password, user.password).then(isMatched => {
                    if (isMatched) {
                        console.log("matched");
                        var token = jwt.sign({
                            id: user._id,
                            name: user.name,
                            email: user.email
                        }, SERVER_SECRET)

                        res.send("jToken",jToken,{
                            maxAge: 86_400_000,
                            httpOnly: true
                        });

                        res.send({
                            message: "login success",
                            user: {
                                name: user.name,
                                email: user.email,
                                phone: user.phone,
                                gender: user.gender,
                            }
                        });
                        res.cookie('jwt',token,{
                            maxAge:86_400_000,
                            httpOnly:true
                        });
                    } else {
                        console.log("not matched");
                        res.status(401).send({
                            message: "incorrect password"
                        })
                    }
                }).catch(e => {
                    console.log("error: ", e)
                });
            } else {
                res.status(403).send({
                    message: "user not found"
                });
            };
        });
});
app.use(function (req, res, next) {

    console.log("req.cookies: ", req.cookies);
    if (!req.cookies.jToken) {
        res.status(401).send("include http-only credentials with every request")
        return;
    }
    jwt.verify(req.cookies.jToken, SERVER_SECRET, function (err, decodedData) {
        if (!err) {

            const issueDate = decodedData.iat * 1000;
            const nowDate = new Date().getTime();
            const diff = nowDate - issueDate; 

            if (diff > 300000) { 
                res.status(401).send("token expired")
            } else { 
                var token = jwt.sign({
                    id: decodedData.id,
                    name: decodedData.name,
                    email: decodedData.email,
                }, SERVER_SECRET)
                res.cookie('jToken', token, {
                    maxAge: 86_400_000,
                    httpOnly: true
                });
                req.body.jToken = decodedData
                next();
            }
        } else {
            res.status(401).send("invalid token")
        }
    });
})

app.get("/profile", (req, res, next) => {

    console.log(req.body)

    userModel.findById(req.body.jToken.id, 'name email phone gender createdOn',
        function (err, doc) {
            if (!err) {
                res.send({
                    profile: doc
                })
            } else {
                res.status(500).send({
                    message: "server error"
                })
            }
        })
})

app.post("/logout", (req, res, next) => {
    res.cookie('jToken', "", {
        maxAge: 86_400_000,
        httpOnly: true
    });
    res.send("logout success");
})


var PORT = process.env.PORT || 5000;

app.listen(PORT, function () {
    console.log("server is running on " + PORT);
})