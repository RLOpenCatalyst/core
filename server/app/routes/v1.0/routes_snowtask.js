
var snowtaskService = require('_pr/services/snowtaskService');


module.exports.setRoutes = function(app, verificationFunc) {

    app.all('/snowtask*', verificationFunc);


    app.get('/snowtask', function(req,res,next){
            console.log("--------------------------in snowtask");

            //calling the service layer
            snowtaskService.saveSnowTask(function(err,result){
                if(err){
               //     logger.error("Error", err);
                    res.send(err);
                    return;
                }else{

                   // console.log(JSON.parse(result));
                }
            
            });
            
       
    });



   
}