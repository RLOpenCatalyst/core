//User Migration script
var server = "localhost";
var port = "27017";
var dbname = "devops_new";
db = connect(server + ':' + port + '/' + dbname);
// db.blueprints.update(
// 	{users:["sd1"]},
// 	{$set: {'users':["superadmin"]}},
// 	{multi:true}
	
// );
// db.instances.update({},{$addToSet :{users:"superadmin"}},{multi:true});
// db.d4dmastersnew.update({rowid:"61"},{$set :{userrolename:"Admin"}});
// db.d4dmastersnew.update({rowid:"62"},{$set :{userrolename:"Designer"}});
// db.d4dmastersnew.update({rowid:"63"},{$set :{userrolename:"Consumer"}});
// db.d4dmastersnew.update({rowid:"91"},{$set :{files:"Workspace,blueprints"}});
// db.d4dmastersnew.remove({userrolename:"SUPERADMIN",id:"6"},true);
// // db.d4dmastersnew.update(
// // 	{id:"7"},
// // 	{$set: {'userrolename':"Admin"}},
// // 	{multi:true}
// // );
// db.d4dmastersnew.update({loginname:"sd1"},{$set :{loginname:"superadmin"}});
// //The below code will set all masters to active.
// db.d4dmastersnew.update(
// 	{},
// 	{$set: {'active':true}},
// 	{multi:true}
// );


//Migrate to New BP Design - Update script
//backing up existing db
//Step 1. Create a db with todays date
print("Current db will be backed up to " + dbname + "_" + Date.now());
db.copyDatabase(dbname,dbname + "_" + Date.now());

//Template Types
db.d4dmastersnew.update({"id":"16","templatetypename":"AppFactory"},{$set :{templatetypename:"SoftwareStack"}},false,true);
db.d4dmastersnew.update({"id":"16","templatetypename":"CloudFormation"},{$set :{templatetype:"cft"}},false,true);
db.d4dmastersnew.update({"id":"16","templatetypename":"DevOpsRoles"},{$set :{templatetypename:"OSImage",templatetype:"ami"}},false,true);

//Templates
db.d4dmastersnew.update({"id":"17","templatetypename":"AppFactory"},{$set :{templatetypename:"SoftwareStack"}},false,true);
db.d4dmastersnew.remove({"id":"16","templatetypename":"Desktop"});
db.d4dmastersnew.remove({"id":"16","templatetypename":"Environment"});
//blueprints
db.blueprints.update({"templateType":"AppFactory"},{$set :{templatetypename:"chef","templateType":"chef"}},false,true);
db.blueprints.update({"templateType":"Docker"},{$set :{templatetypename:"docker","templateType":"docker"}},false,true);
db.blueprints.update({"templateType":"CloudFormation"},{$set :{templatetypename:"cft"}},false,true);
db.blueprints.update({"templateType":"DevOpsRoles"},{$set :{templatetypename:"ami"}},false,true);

print('Updation successful.');
//End of Migrate to New BP Design - Update script




