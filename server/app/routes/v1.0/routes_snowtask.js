
var snowtaskService = require('_pr/services/snowtaskService');


module.exports.setRoutes = function(app, verificationFunc) {

    app.all('/snowtask*', verificationFunc);


    app.get('/snowtask', function(req,res){
            console.log("--------------------------in snowtask");

            req.query.user = req.session.user.cn;
            //logger.info(req.query.user)
            //calling the service layer
            snowtaskService.saveSnowTask(req.query,req.query.startdiff,req.query.enddiff,function(err,result){
                if(err){
               //     logger.error("Error", err);
                    res.send(err);
                    return;
                }else{
                    return res.status(200).send(result);
                  // console.log("---------"+JSON.stringify(result));
                }
            
            });
            
       
    });



   
}