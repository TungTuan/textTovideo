const mongoose = require('mongoose');

async function connect() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/tungnt_dev'), {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
        console.log('Connect database success!!');
    } catch (error) {
        console.log('Connect database fail!!!');
    }

}

module.exports = {connect};