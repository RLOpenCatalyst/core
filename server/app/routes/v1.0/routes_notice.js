/*
 Copyright [2016] [Relevance Lab]
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var noticeService = require('_pr/services/noticeService');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/notice/*', sessionVerificationFunc);

    app.post('/notice/notify',function(req,res){
        if(req.body.userid && req.body.userid !== null){
            var message ={title:req.body.title,body:req.body.body}
            noticeService.notice(req.body.userid,message,req.body.severity,function(err,data){
                if(err){
                   return res.sendStatus(500);
                }else{
                   return res.json(data);
                }
            });
        }else{
            return res.sendStatus(400);
        }
    });

    app.post('/notice/update',function(req,res){
        if(req.body.userid && req.body.userid !== null){
            noticeService.updater(req.body.userid,req.body.type,req.body.data,function(err,msg){
                return res.json(msg);
            })
        }else{
            return res.sendStatus(400);
        }
    });

    app.get('/notice/',function(req,res){
        noticeService.getAllNoticeWithPagination(req.query, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });
}