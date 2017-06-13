var mongoose = require('mongoose');

var AzureSchema = new mongoose.Schema({
    clientID: { type: String, required: true },
    clientSecret: { type: String, required: true },
    tenant: { type: String, required: false},
    resource: { type: String, required: false }, 
    created_at    : { type: Date },
    updated_at    : { type: Date }
});

var Azure = mongoose.model('Azure', AzureSchema);


// Pre save
AzureSchema.pre('save', function(next) {
    var now = new Date();
    this.updated_at = now;
    if ( !this.created_at ) {
        this.created_at = now;
    }
    next();
});

module.exports = Azure;

