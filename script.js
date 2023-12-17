const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const session = require('express-session');




const app = express();
app.use(
  session({
    secret: "secret-key", // O cheie secretă utilizată pentru a semna cookie-urile
    resave: false, // Dacă să salveze sesiunea la fiecare cerere (setați la false pentru a economisi resurse)
    saveUninitialized: true, // Dacă să creeze o sesiune pentru fiecare utilizator nou (setați la true pentru a crea automat sesiuni noi)
    cookie: {
      secure: false, // Dacă sesiunea trebuie să folosească HTTPS (setați la true în producție)
      maxAge: 1000 * 60 * 60, // Durata de viață a sesiunii în milisecunde (aici, 1 oră)
    },
  })
);


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Specifică directorul "views" pentru șabloane


app.use(express.urlencoded({ extended: false }));
app.use(express.json());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // __dirname reprezintă calea către directorul curent al fișierului de server
app.use('/styles', express.static(__dirname + '/styles', { 'extensions': ['css'] }));
app.use('/scripts', express.static(__dirname + '/scripts', { 'extensions': ['js'] }));


app.get("/signout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/"); // Redirecționați utilizatorul către pagina de start după încheierea sesiunii
  });
});

app.get("/account", verificaAutentificarea, (req, res) => {
  res.render("account", { user: req.session.utilizator });
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/login.html"); // Redirecționează către login.html
});

app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/register.html"); // Redirecționează către register.html
});
app.get("/index", (req, res) => {
  res.sendFile(__dirname + "/index.html"); // Redirecționează către register.html
});

app.get("/main", verificaAutentificarea, (req, res) => {
  res.sendFile(__dirname + "/main.html");
});

function verificaAutentificarea(req, res, next) {
  if (req.session && req.session.utilizator) {
    return next(); // Utilizatorul este autentificat
  }
  res.redirect("/login"); // Utilizatorul nu este autentificat, redirecționare către pagina de autentificare
}


// Conectați-vă la baza de date MongoDB utilizând URL-ul de conectare furnizat de MongoDB Atlas
const dbUrl = "mongodb+srv://bvbjade9:yzv3XtRuOb6S3SwN@nutryz.amhlyfg.mongodb.net/";
mongoose
  .connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

// Definiți un model pentru utilizatori
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String, 
  dateOfBirth: Date, 
  country: String,   
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

const User = mongoose.model("User", userSchema);



app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    // Căutați utilizatorul în baza de date
    const user = await User.findOne({ name: username });

    if (!user) {
      res.sendFile(__dirname + "/login.html", { error: "Credențiale incorecte." });
      return;
    }

    // Comparați parola introdusă cu parola stocată în baza de date
    const issPassword = await bcrypt.compare(password, user.password);
    if (issPassword) {
      req.session.utilizator = user;
      res.redirect("/main");
    } else {
      res.sendFile(__dirname + "/login.html", { error: "Credențiale incorecte." });
    }
  } catch (err) {
    console.error("Eroare la autentificare:", err);
    res.status(500).send("Eroare la autentificare");
  }
});

app.post("/register", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const dateOfBirth = req.body.dateOfBirth;
  
  const country = req.body.country;

  // Creați o nouă instanță de utilizator utilizând modelul definit
  const newUser = new User({
    name: name,
    email: email,
    password: password,
    dateOfBirth: dateOfBirth,
    country: country,
  });


  //criptare

 
  // Salvați utilizatorul în baza de date folosind Promisiuni
  newUser.save()
    .then(() => {
      console.log("User saved successfully");
      res.redirect("/login");
      
    })
    .catch((err) => {
      console.error("Error saving user:", err);
      res.status(500).send("Error saving user");
    });
});







const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});