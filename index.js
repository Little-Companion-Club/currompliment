const express = require('express');
const app = express();
const axios = require('axios');
const bcrypt = require('bcrypt');
const fs = require('fs');

var bodyParser = require('body-parser');
jsonBodyParser = bodyParser.json();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./site/'));

hash = async (password) => {
    pass = await bcrypt.hash(password, parseInt(process.env.SR));
    return pass;
}
const { UniqueID } = require('nodejs-snowflake');

const uid = new UniqueID({
    returnNumber: false
}); 

    //incoming: imap.gmail.com:993
    //POP: pop.gmail.com:995
    //outgoing: smtp.gmail.com:465/587
app.get('/', (req, res) => {
    res.send('boop');
});
app.get('/make_transaction', (req, res) => {
    res.sendFile(`${process.cwd()}/site/make_transaction.html`);
});
app.get('/register', (req, res) => {
    res.sendFile(`${process.cwd()}/site/register.html`);
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

app.post('/pending_transaction', (req, res) => {
    
});
app.post('/conduct_transaction', async (req, res) => {
    let not_provided = [];
    for (const [key, value] of Object.entries(req.body)) {
        if (!value) not_provided.push(key);
    }
    if (not_provided[0]) return res.send(`You have not provided your ${not_provided.join(', ')}!`);
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
    if (!responsea.data[0].username === req.body.sendtoname) return res.send('The email you are trying to send credits to does not have the username that you provided...');
    const match = await bcrypt.compare(req.body.password, response.data[0].password);
    if (match === true) {
        await axios.post('https://json.ldbc.cf', {
            "username": process.env.USER,
            "database": process.env.DB,
            "password": process.env.PASS,
            "intent": 'insert',
            "table": 'logs',
            "collumns": ['email', 'username', 'balance', 'send_amount', 'sendtoemail', 'sendtousername', 'sendtouserbalance', 'compliment', 'transaction_id', 'status'],
            "data": [req.body.email, req.body.username, response.data[0].balance, parseInt(req.body.amount), req.body.sendtoemail, req.body.sendtoname, responsea.data[0].balance, req.body.compliment, uid.getUniqueID(), 'pending']
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
});

app.get('/approve_transaction/:id', async (req, res) => {
    if (req.query.pass === process.env.PASS) {
        if (req.query.user === process.env.USER) {
            if (req.query.db === process.env.DB) {
                response = await axios.post('https://json.ldbc.cf', {
                    "username": process.env.USER,
                    "database": process.env.DB,
                    "password": process.env.PASS,
                    "intent": 'select',
                    "table": 'logs',
                    "collumns": ['transaction_id'],
                    "data": [req.params.id]
                });
                transaction = response.data[0];
                if (transaction.status === 'approved') return res.send('Transaction already approved.');
                responsea = await axios.post('https://json.ldbc.cf', {
                    "username": process.env.USER,
                    "database": process.env.DB,
                    "password": process.env.PASS,
                    "intent": 'select',
                    "table": 'accounts',
                    "collumns": ['email'],
                    "data": [transaction.email]
                });
                responseb = await axios.post('https://json.ldbc.cf', {
                    "username": process.env.USER,
                    "database": process.env.DB,
                    "password": process.env.PASS,
                    "intent": 'select',
                    "table": 'accounts',
                    "collumns": ['email'],
                    "data": [transaction.sendtoemail]
                });
                bala = responsea.data[0].balance - transaction.send_amount;
                balb = responseb.data[0].balance + transaction.send_amount;
                try {
                    await axios.post('https://json.ldbc.cf', {
                        "username": process.env.USER,
                        "database": process.env.DB,
                        "password": process.env.PASS,
                        "intent": 'update',
                        "table": 'accounts',
                        "wherecollumns": ['email'],
                        "wherevalues": [transaction.email],
                        "collumns": ['balance'],
                        "values": [bala]
                    });
                    await axios.post('https://json.ldbc.cf', {
                        "username": process.env.USER,
                        "database": process.env.DB,
                        "password": process.env.PASS,
                        "intent": 'update',
                        "table": 'accounts',
                        "wherecollumns": ['email'],
                        "wherevalues": [transaction.sendtoemail],
                        "collumns": ['balance'],
                        "values": [balb]
                    });
                    await axios.post('https://json.ldbc.cf', {
                        "username": process.env.USER,
                        "database": process.env.DB,
                        "password": process.env.PASS,
                        "intent": 'update',
                        "table": 'logs',
                        "wherecollumns": ['transaction_id'],
                        "wherevalues": [req.params.id],
                        "collumns": ['status'],
                        "values": ['approved']
                    });
                    res.send('Success!');
                } catch (err) {
                    console.log(err);
                    res.send('An error has occured.');
                }
                    
            }
        }
    }
});
app.get('/review/:status', async (req, res) => {
    if (req.query.pass === process.env.PASS) {
        if (req.query.user === process.env.USER) {
            if (req.query.db === process.env.DB) {
                response = await axios.post('https://json.ldbc.cf', {
                    "username": process.env.USER,
                    "database": process.env.DB,
                    "password": process.env.PASS,
                    "intent": 'select',
                    "table": 'logs',
                    "collumns": ['status'],
                    "data": [req.params.status]
                });
                let string = '';
                for (const data of response.data) {
                    responsea = await axios.post('https://json.ldbc.cf', {
                        "username": process.env.USER,
                        "database": process.env.DB,
                        "password": process.env.PASS,
                        "intent": 'select',
                        "table": 'accounts',
                        "collumns": ['email'],
                        "data": [data.email]
                    });
                    responseb = await axios.post('https://json.ldbc.cf', {
                        "username": process.env.USER,
                        "database": process.env.DB,
                        "password": process.env.PASS,
                        "intent": 'select',
                        "table": 'accounts',
                        "collumns": ['email'],
                        "data": [data.sendtoemail]
                    });
                    let approve_button = '';
                    if (req.params.status === 'pending') approve_button = '<a href="https://currompliment.lilcompclub.repl.co/approve_transaction/${data.transaction_id}?db=${process.env.DB}&pass=${process.env.PASS}&user=${process.env.USER}">(Approve)</a>';

                    string += `<strong>Transaction ID: ${data.transaction_id} ${approve_button}</strong><ul><li>User Balance: ${responsea.data[0].balance}</li><li>Send Amount: ${data.send_amount}</li><li>Send to User Balance: ${responseb.data[0].balance}</li><li>Compliment(s): ${data.compliment}</li></ul><br>`;
                }
                res.send(string);
            }
        }
    }
});


app.get('/transactions/:status', async (req, res) => {
    file = fs.readFileSync('./site/login.html').toString().replace(/:status/g, req.params.status);
    res.send(file);
});
app.post('/transactions/:status', async (req, res) => {
    response = await axios.post('https://json.ldbc.cf', {
        "username": process.env.USER,
        "database": process.env.DB,
        "password": process.env.PASS,
        "intent": 'select',
        "table": 'accounts',
        "collumns": ['email'],
        "data": [req.body.email]
    });
    if (!response.data[0]) return res.send('Invalid email/password!');
    const match = await bcrypt.compare(req.body.password, response.data[0].password);
    if (match === true) {
        responsea = await axios.post('https://json.ldbc.cf', {
            "username": process.env.USER,
            "database": process.env.DB,
            "password": process.env.PASS,
            "intent": 'select',
            "table": 'logs',
            "collumns": ['status', 'sendtoemail'],
            "data": [req.params.status, req.body.email]
        });
        responseb = await axios.post('https://json.ldbc.cf', {
            "username": process.env.USER,
            "database": process.env.DB,
            "password": process.env.PASS,
            "intent": 'select',
            "table": 'logs',
            "collumns": ['status', 'email'],
            "data": [req.params.status, req.body.email]
        });
        let string = '';
        for (const data of responsea.data) {
            string += string += `<strong>Transaction ID: ${data.transaction_id}</strong><ul><li>Sent From User+Email: ${data.username}/${data.email}</li><li>Sent To User+Email: ${data.sendtousername}/${data.sendtoemail}</li><li>Send Amount: ${data.send_amount}</li><li>Compliment(s): ${data.compliment}</li></ul><br>`;
        }
        for (const data of responseb.data) {
            string += string += `<strong>Transaction ID: ${data.transaction_id}</strong><ul><li>Sent From User+Email: ${data.username}/${data.email}</li><li>Sent To User+Email: ${data.sendtousername}/${data.sendtoemail}</li><li>Send Amount: ${data.send_amount}</li><li>Compliment(s): ${data.compliment}</li></ul><br>`;
        }
        res.send(string);
    } else res.send('Invalid email/password!');
});

app.get('/account_info', async (req, res) => {
    file = fs.readFileSync('./site/login.html').toString().replace(/:status/g, 'account_info');
    res.send(file);
});
app.post('/account_info', async (req, res) => {
    response = await axios.post('https://json.ldbc.cf', {
        "username": process.env.USER,
        "database": process.env.DB,
        "password": process.env.PASS,
        "intent": 'select',
        "table": 'accounts',
        "collumns": ['email'],
        "data": [req.body.email]
    });
    if (!response.data[0]) return res.send('Invalid email/password!');
    const match = await bcrypt.compare(req.body.password, response.data[0].password);
    if (match === true) {
        res.send(`<ul><li>Email: <strong>${response.data[0].email}</strong></li><li>Username: <strong>${response.data[0].username}</strong></li><li>Compliment Credits: <strong>${response.data[0].balance}</strong></li><li><a href="https://currompliment.lilcompclub.repl.co/transactions/approved">Approved Transactions</a></li><li><a href="https://currompliment.lilcompclub.repl.co/transactions/pending">Pending Transactions</a></li>`)
    } else res.send('Invalid email/password!');
});
app.listen(3000);