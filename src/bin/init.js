
module.exports = function () {
    
    
    // DB changes
    global.db.collection("azureads").rename("azures", function (err, newColl) {
        console.log(err);
        console.log(newColl);
    });

}

