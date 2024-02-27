const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');
const translate = require('google-translate-api');
const path = require('path');
const request = require('request');
const Parfume = require('./database/parfume');
const multer = require('multer');


const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
    destination: path.join(__dirname, '/uploads/'),
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });


mongoose.connect('mongodb+srv://aluabildinova:5Abz70d2aWMGgZhQ@cluster0.chgrl1w.mongodb.net/', {  
useNewUrlParser: true, 
useUnifiedTopology: true,});
const userdb = mongoose.connection;

userdb.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

userdb.once('open', () => {
    console.log('Connected to MongoDB');
});
// Create a user schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: {type: String, unique: true},
  creationDate: { type: Date, default: Date.now },
  password: {type: String, unique: true},
  role: { type: String, default: 'user' },
  isDeleted: { type: Boolean, default: false }
});

// Create a user model
const User = mongoose.model('User', userSchema);

app.use(session({
    secret: 'se-2205',
    resave: false,
    saveUninitialized: true
  }));

app.use((req, res, next) => {
    req.session.language = req.session.language || 'en';
    res.locals.language = req.session.language; 
    next();
});


app.use(express.static(path.join(__dirname, '/public')));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.set('view engine', 'ejs');

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); 

//Authorization
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    } else {
      res.redirect('/login');
    }
  };

const requireAdmin = async (req, res, next) => {
    try {
        if (req.session && req.session.userId) {
            const user = await User.findById(req.session.userId);
            console.log("User role:", user.role);

            if (user && user.role === 'admin') {
                return next();
            } else {
                res.redirect('/main');
            }
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error checking user role');
    }
};
app.get("/regist", function(req, res) {
    res.render("regist");
});
app.post('/regist', async (req, res) => {
    const { username, password, email, role } = req.body;
    console.log('Received password:', password);
    console.log(req.body);
  
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
  
        const newUser = new User({
            username: username,
            email: email,
            password: hashedPassword,
            role: role || 'user',
        });
          await newUser.save();
  
          res.send('registration successful, you can login');
    } catch (error) {
        console.error(error);
        res.send('Error in registration. You Can not Login');
    }
  });

  app.get('/generatePassword', (req, res) => {
    const length = 10;
    const apiUrl = `https://api.api-ninjas.com/v1/passwordgenerator?length=${length}`;
    
    request.get({ url: apiUrl, headers: { 'X-Api-Key': 'zCiu/SIh1DDgLodOdcw3WA==OYVqYLWc7uA1WSgn' } }, (error, response, body) => {
      if (error) {
        console.error('Request failed:', error);
        res.status(500).send('Error generating password');
      } else if (response.statusCode !== 200) {
        console.error('Error:', response.statusCode, body.toString('utf8'));
        res.status(response.statusCode).send('Error generating password');
      } else {
        const generatedPassword = body.trim();
        res.send(generatedPassword);
      }
    });
  });


  app.get('/admin', requireAuth, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const users = await User.find({ role: { $ne: 'admin' } });

        const parfumes = await Parfume.find();

        res.render('admin', { users: users, parfumes: parfumes, username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
    }
});



app.get('/admin/addparfume', requireAuth, requireAdmin, (req, res) => {
    res.render('addparfume');
});


app.post('/admin/addparfume', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
    console.log(req.file);
    try {
        const { name, genre, price } = req.body;
        const image = req.file ? req.file.filename : null;

        const newParfume = new Parfume({
            name,
            genre,
            price,
            image: req.file ? req.file.originalname : null,
        });

        await newParfume.save();

        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding a new perfume');
    }
});


app.delete('/deleteparfume/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const result = await Parfume.deleteOne({ _id: req.params.id });

        if (result.deletedCount === 0) {
            // Parfume with the given ID does not exist
            return res.status(404).json({ error: 'Parfume not found' });
        }

        res.status(200).json({ message: 'Parfume deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `Error deleting parfume: ${error.message}` });
    }
});

app.get("/", function(req, res) {
    res.redirect("/regist");
});



app.get('/main', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const city = 'Almaty'; 
        const apiUrl = 'https://api.api-ninjas.com/v1/worldtime?city=' + city;
        const apiKey = 'zCiu/SIh1DDgLodOdcw3WA==OYVqYLWc7uA1WSgn'; 

        // Make the request
        request.get({ url: apiUrl, headers: { 'X-Api-Key': apiKey } }, function (error, response, body) {
            if (error) {
                console.error('Request failed:', error);
                res.status(500).send('Error fetching world time data');
            } else if (response.statusCode !== 200) {
                console.error('Error:', response.statusCode, body.toString('utf8'));
                res.status(response.statusCode).send('Error fetching world time data');
            } else {
                const worldTimeData = JSON.parse(body);
                res.render('main', {
                    username: user.username,
                    worldTime: worldTimeData,
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching user data');
    }
});




  app.get('/login', (req, res) => {
    res.render('login');
  });
  
  // Handle user login
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).send('Invalid username or password');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            req.session.userId = user._id;
            req.session.language = req.body.language
            requireAdmin(req, res, () => {
                res.redirect('/admin');
            });
        } else {
            return res.status(401).send('Invalid username or password');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error during login.');
    }
});


app.delete('/deleteuser/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const result = await User.deleteOne({ _id: req.params.id, role: { $ne: 'admin' } });

        if (result.deletedCount === 0) {
            // User with the given ID does not exist or is an admin
            return res.status(404).json({ error: 'User not found or cannot delete admin' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `Error deleting user: ${error.message}` });
    }
});


app.get('/forher', async (req, res) => {
    try {
        const femaleParfumes = await Parfume.find({ genre: 'female' });
        res.render('forher', { parfumes: femaleParfumes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching female parfumes');
    }
});


app.get('/forhim', async (req, res) => {
    try {
        const maleParfumes = await Parfume.find({ genre: 'male' });
        res.render('forhim', { parfumes: maleParfumes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching male parfumes');
    }
});

app.post('/setLanguage', (req, res) => {
    const { language } = req.body;
    req.session.language = language;
    res.redirect('/login');
  });


app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});