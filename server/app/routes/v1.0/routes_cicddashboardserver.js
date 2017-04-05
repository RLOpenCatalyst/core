var cicdDashboardService = require('_pr/services/cicdDashboardService');
var async = require('async');
var validate = require('express-validation');
var cicdDashboardServerValidator = require('_pr/validators/cicdDashboardServerValidator');
var logger = require('_pr/logger')(module);


module.exports.setRoutes = function(app, sessionVerificationFunc) {
	app.all('/cicd-dashboardservice*', sessionVerificationFunc);



	app.get("/cicd-dashboardservice", getcicdDashboardList);

    function getcicdDashboardList(req, res) {
        async.waterfall([
            function(next) {
                cicdDashboardService.getcicdDashboardServerList(req.query,req.session.user.cn, next);
            }
        ], function(err, monitors) {
            if (err) {
                res.status(err.status).send(err);
            } else {
                res.status(200).send(monitors);
            }
        });
    }

    app.get('/cicd-dashboardservice/:cicdDashboardServerId', getcicdDashboardServerById);
    function getcicdDashboardServerById(req, res) {
        async.waterfall(
            [
                function(next) {
                    cicdDashboardService.checkIfcicdDashboardServerExists(req.params.cicdDashboardServerId, next);
                },
                function(gitHub,next) {
                    cicdDashboardService.getcicdDashboardServerById(req.params.cicdDashboardServerId, next);
                }
            ],
            function(err, results) {
                if (err) {
                    res.status(err.status).send(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }

    app.get('/cicd-dashboardservice/orgId/:orgId', getcicdDashboardServerByOrgId);
    function getcicdDashboardServerByOrgId(req, res) {
        async.waterfall(
            [
                function(next) {
                    cicdDashboardService.getcicdDashboardServerByOrgId(req.params.orgId, next);
                }
            ],
            function(err, results) {
                if (err) {
                    res.status(err.status).send(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }

    app.post('/cicd-dashboardservice', validate(cicdDashboardServerValidator.create), createcicdDashboardServer);

    function createcicdDashboardServer(req, res) {
        async.waterfall(
            [
                function(next) {
                    cicdDashboardService.createcicdDashboardServer(req.body, next);
                }
            ],
            function(err, results) {
                if (err) {
                    res.status(err.status).send(err);
                } else {
                    return res.status(201).send(results);
                }
            }
        );
    }

    app.put('/cicd-dashboardservice/:cicdDashboardServerId', validate(cicdDashboardServerValidator.update), updatecicdDashboardServer);

    function updatecicdDashboardServer(req, res) {
        async.waterfall(
            [
                function(next) {
                    cicdDashboardService.checkIfcicdDashboardServerExists(req.params.cicdDashboardServerId, next);
                },
                function(gitHub, next) {
                    cicdDashboardService.updatecicdDashboardServer(req.params.cicdDashboardServerId, req.body, next);
                }
            ],
            function(err, results) {
                if (err) {
                    res.status(err.status).send(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }

    app.delete('/cicd-dashboardservice/:cicdDashboardServerId', deletecicdDashboardServer);

    function deletecicdDashboardServer(req, res) {
        async.waterfall(
            [
                function(next) {
                    cicdDashboardService.checkIfcicdDashboardServerExists(req.params.cicdDashboardServerId, next);
                },
                function(dependency, next)
                {
                  cicdDashboardService.checkForDashboardDependency(req.params.cicdDashboardServerId, next);
                },
                function(monitor, next)
                {
                    if(monitor === null) {
                        cicdDashboardService.deletecicdDashboardServer(req.params.cicdDashboardServerId, next);
                    }else{
                        next(null,{warning:"Dependent Dashboard(s) Exists. Unable to Delete"})
                    }
                }
            ],
            function(err, results) {
                if (err) {
                    res.status(err.status).send(err);
                } else {
                    logger.info(results.warning);
                    return res.status(200).send(results);
                }
            }
        );
    }






};