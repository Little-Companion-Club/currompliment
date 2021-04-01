const express = require('express');
const app = express();
const axios = require('axios');
const bcrypt = require('bcrypt');

var bodyParser = require('body-parser');
jsonBodyParser = bodyParser.json();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./site/'));

hash = async (password) => {
    pass = await bcrypt.hash(password, parseInt(process.env.SR));
    return pass;
}

app.get('/', (req, res) => {
    res.send('boop');
    //incoming: imap.gmail.com:993
    //POP: pop.gmail.com:995
    //outgoing: smtp.gmail.com:465/587
});
app.get('/make_transaction', (req, res) => {
    res.sendFile(`${process.cwd()}/site/make_transaction.html`);
    //incoming: imap.gmail.com:993
    //POP: pop.gmail.com:995
    //outgoing: smtp.gmail.com:465/587
});
app.get('/register', (req, res) => {
    res.sendFile(`${process.cwd()}/site/register.html`);
    //incoming: imap.gmail.com:993
    //POP: pop.gmail.com:995
    //outgoing: smtp.gmail.com:465/587
});
app.post('/create_account', async (req, res) => {
    //console.log(req);
    email = req.body.email;
    //email = require('crypto').createHash('md5').update(email).digest("hex");
    username = req.body.username;
    password = req.body.password;
    password = await hash(password);
    //password = require('crypto').createHash('md5').update(password).digest("hex");
    response = await axios.post('https://json.ldbc.cf', {
        "username": process.env.USER,
        "database": process.env.DB,
        "password": process.env.PASS,
        "intent": 'select',
        "table": 'accounts',
        "collumns": ['email'],
        "data": [email]
    });
    //console.log(response.data);
    //console.log(email, username, password)
    //console.log(response.data[0]);
    if (!response.data[0]) {
        try {
            response = await axios.post('https://json.ldbc.cf', {
                "username": process.env.USER,
                "database": process.env.DB,
                "password": process.env.PASS,
                "intent": 'insert',
                "table": 'accounts',
                "collumns": ['email', 'username', 'password', 'balance'],
                "data": [email, username, password, 0]
            });
            res.send('Success! <br>Remember, the amount of compliment credits you give someone is based on the effort of the compliment you give, because you\'re the one paying them, <br>if they\'re paying you then they give you a compliment based on the amount of credits they wanna give: <br><br>low effort compliments = 1 compliment credit<br>slightly more effort compliments = 5 compliment credits<br>slightly more detailed compliments = 10 compliment credits<br>detailed and close/personal compliments = 20 compliment credits*<br><br>Disclaimer: value of currency will fluctuate for a while, these values aren\'t set in stone, I might change it at some point<br><br>If I see any abuse of the system, the abusers will have their accounts terminated.');
            //console.log(response);
        } catch (err) {
            res.send('An error has occured.');
        }
            
        
    } else res.send('Email already exists!');
    
});

app.get('register', (req, res) => {

});
app.post('/pending_transaction', (req, res) => {
    
});
app.post('/conduct_transaction', async (req, res) => {
    let not_provided = [];
    for (const [key, value] of Object.entries(req.body)) {
        if (!value) not_provided.push(key);
    }
    res.send(`You have not provided your ${not_provided.join(', ')}!`);
    response = await axios.post('https://json.ldbc.cf', {
        "username": process.env.USER,
        "database": process.env.DB,
        "password": process.env.PASS,
        "intent": 'select',
        "table": 'accounts',
        "collumns": ['email'],
        "data": [req.body.email]
    });
    responsea = await axios.post('https://json.ldbc.cf', {
        "username": process.env.USER,
        "database": process.env.DB,
        "password": process.env.PASS,
        "intent": 'select',
        "table": 'accounts',
        "collumns": ['email'],
        "data": [req.body.sendtoemail]
    });
    if (!response.data[0]) return res.send('Invalid email/password!');
    if (!responsea.data[0]) return res.send('The email you are trying to send compliments to does not exist...');
    const match = await bcrypt.compare(password, response.data[0].password);
    if (match === true) {
        await axios.post('https://json.ldbc.cf', {
            "username": process.env.USER,
            "database": process.env.DB,
            "password": process.env.PASS,
            "intent": 'insert',
            "table": 'logs',
            "collumns": ['email', 'username', 'password', 'balance', 'amount', 'sendtoemail', 'sendtousername', 'compliment'],
            "data": [req.body.email, req.body.username, req.body.password, response.data[0].balance, req.body.amount, req.body.sendtoemail, req.body.sendtoname, req.body.compliment]
        });
        res.send('Transaction successfully started. Please wait while it is reviewed. Please do not be upset if it gets cancelled/rejected.')
    } else res.send('Invalid email/password!');
});
/*
app.post('/validate', async (req, res) => {
    email = req.body.email;
    username = req.body.username;
    password = req.body.password;
    response = await axios.post('https://json.ldbc.cf', {
        "username": process.env.USER,
        "database": process.env.DB,
        "password": process.env.PASS,
        "intent": 'select',
        "table": 'accounts',
        "collumns": ['email'],
        "data": [email]
    });
    if (!response.data[0]) return res.send('Email does not exist');
    const match = await bcrypt.compare(password, response.data[0].password);
    return res.send(match);
});*/
app.get('/guidelines', (req, res) => {
    res.send('The amount of compliment credits you give someone is based on the effort of the compliment you give, because you\'re the one paying them, <br>if they\'re paying you then they give you a compliment based on the amount of credits they wanna give: <br><br>low effort compliments = 1 compliment credit<br>slightly more effort compliments = 5 compliment credits<br>slightly more detailed compliments = 10 compliment credits<br>detailed and close/personal compliments = 20 compliment credits*<br><br>Disclaimer: value of currency will fluctuate for a while, these values aren\'t set in stone, I might change it at some point<br><br>If I see any abuse of the system, the abusers will have their accounts terminated.');
})
app.listen(3000);