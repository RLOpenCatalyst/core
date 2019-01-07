
var bots=["591da6a7ce9dce000789bfef","5923f084c1349700072a2a48","59254171c1349700078a36b6","5925680fc9dd140007595261"];
var summary=[]

for(var i=0;i<bots.length;i++){
    for(var j=1;j<32;j++){
        if(j<10){
            j='0'+j
        }
        var data={
            botID:bots[i],
            user:"superadmin",
            date:`2018-12-${j}T00:00:00Z`,
            successCount:parseInt(j),
            sfailedCount:32-parseInt(j)
        }
        summary.push(data);
    }
}
console.log(JSON.stringify(summary))

