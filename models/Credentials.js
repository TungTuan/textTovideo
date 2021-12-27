const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Credential = new Schema({
    client_id: {type: String},
    project_id: {type: String},
    auth_uri: {type: String},
    token_uri: {type: String},
    auth_provider_x509_cert_url: {type: String},
    client_secret: {type: String},
    redirect_uris: {type: [String]},
    javascript_origins: {type: [String]},
    count: {type: Number},
});

module.exports = mongoose.model('Credential', Credential);