const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "raj-secret",
    resave: false,
    saveUninitialized: false
}));

mongoose.connect("mongodb://mongo-service:27017/authdb")
.then(() => console.log("Mongo Connected"))
.catch(err => console.log(err));

const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model("User", UserSchema);

function isAuth(req, res, next) {
    if (req.session.user) next();
    else res.redirect("/login");
}

const style = `
<style>
body {
    margin:0;
    font-family: Arial, sans-serif;
    height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;
    background: linear-gradient(135deg,#667eea,#764ba2);
}
.card {
    background:white;
    padding:40px;
    border-radius:12px;
    box-shadow:0 10px 25px rgba(0,0,0,0.2);
    width:320px;
    text-align:center;
    animation: fadeIn 0.6s ease-in-out;
}
h2 { margin-bottom:20px; }
input {
    width:100%;
    padding:10px;
    margin:8px 0;
    border-radius:6px;
    border:1px solid #ccc;
}
button {
    width:100%;
    padding:10px;
    background:#667eea;
    color:white;
    border:none;
    border-radius:6px;
    cursor:pointer;
    transition:0.3s;
}
button:hover {
    background:#5a67d8;
    transform:scale(1.05);
}
a {
    display:block;
    margin-top:10px;
    text-decoration:none;
    color:#667eea;
}
@keyframes fadeIn {
    from { opacity:0; transform:translateY(20px); }
    to { opacity:1; transform:translateY(0); }
}
</style>
`;

app.get("/", (req, res) => res.redirect("/login"));

app.get("/signup", (req, res) => {
    res.send(`
    <html><head><title>Signup</title>${style}</head>
    <body>
        <div class="card">
            <h2>Signup</h2>
            <form method="POST">
                <input name="username" placeholder="Username" required/>
                <input name="password" type="password" placeholder="Password" required/>
                <button>Signup</button>
            </form>
            <a href="/login">Login</a>
        </div>
    </body></html>
    `);
});

app.post("/signup", async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 10);
    await User.create({ username: req.body.username, password: hash });
    res.redirect("/login");
});

app.get("/login", (req, res) => {
    res.send(`
    <html><head><title>Login</title>${style}</head>
    <body>
        <div class="card">
            <h2>Login</h2>
            <form method="POST">
                <input name="username" placeholder="Username" required/>
                <input name="password" type="password" placeholder="Password" required/>
                <button>Login</button>
            </form>
            <a href="/signup">Signup</a>
        </div>
    </body></html>
    `);
});

app.post("/login", async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.send("User not found");

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) return res.send("Wrong password");

    req.session.user = user;
    res.redirect("/dashboard");
});

app.get("/dashboard", isAuth, (req, res) => {
    res.send(`
    <html><head><title>Dashboard</title>${style}</head>
    <body>
        <div class="card">
            <h2>Welcome ${req.session.user.username}</h2>
            <p>You are successfully logged in 🎉</p>
            <a href="/logout"><button>Logout</button></a>
        </div>
    </body></html>
    `);
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

app.listen(3000, () => console.log("Server started"));