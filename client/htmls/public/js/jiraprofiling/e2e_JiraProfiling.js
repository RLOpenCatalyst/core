'use strict';
//debugger;

//pageSetUp();
var soProfiling;
var soProfileInstance = function() {
	soProfiling = new soProfilingObject();
	soProfiling.Load();
};

var soProfilingObject = function() {
	var THIS = this;

	var numberFormat = d3.format(",f");
	THIS.type = "materialCount";
	//constructTabs(THIS);
	this.Load = function(obj) {
		//enableLoading();
		var source = $(obj).data("source");
		THIS.source = source || $("#myTab").find("li.active").data("source");
		var request = {
			"source" : THIS.source,
			"viewType" : "default"
		};
		drawChart();
		/*callAjaxService("JiraProfile", callbackSuccessSOProfile, callBackFailure,
				request, "POST");*/
	};

	this.loadViewType = function(viewType) {
		//enableLoading();
		THIS.type = viewType;
		setTimeout(function() {
			drawChart(); 
			//disableLoading();
		}, 50);
	};

	var callbackSuccessSOProfile = function(data) {
		/*
		 * private String soCount; a private String companyCode; b private
		 * String companyName; c private String salesOrg; d private String
		 * salesOrgName; e private String salesGroup; f private String
		 * salesGroupName; g private String division; h private String
		 * divisionName; i private String salesDocType; j private String
		 * plantGroup; k private String plantName; l private String netValue; m
		 * private String source; n private String region; o private String
		 * lastChanged; p private String materialType; q private String soType;
		 * r
		 */
		//disableLoading();
		if (data && data.isException){
			showNotification("error",data.customMessage);
			return;
		}
		if (data != undefined && data != null
				&& data["aggregatedSalesOrderList"] != undefined
				&& data["aggregatedSalesOrderList"] != null && data["aggregatedSalesOrderList"].length > 0) {
			THIS.data = data["aggregatedSalesOrderList"];
			drawChart();
		}
	};

	var drawChart = function() {
		
		d3.csv("data/jiraData.csv", function(error, experiments) {
			console.log(experiments);
			 experiments.forEach(function(x) {
				x.count = 1;
			  });
			 /*var chart = dc.pieChart("#test");*/
			  var ndx = crossfilter(experiments);
			  

			  THIS.pieChartIssueType = dc.pieChart("#pie-chart-IssueType");
			  var pieChartIssueTypeDimension = ndx.dimension(function(d){return d.Issue_Type; });
			  var pieIssueType = pieChartIssueTypeDimension.group();
			  
			  THIS.pieChartStatus = dc.pieChart("#pie-chart-Status");
			  var pieChartStatusDimension = ndx.dimension(function(d){return d.Status; });
			  var pieStatus = pieChartStatusDimension.group();
			  
			  THIS.pieChartFixVersions = dc.pieChart("#pie-chart-FixVersions");
			  var pieChartFixVersionsDimension = ndx.dimension(function(d){return d.FixVersions; });
			  var pieFixVersions = pieChartFixVersionsDimension.group();
			  
			  THIS.pieChartPriority = dc.pieChart("#pie-chart-Priority");
			  var pieChartPriorityDimension = ndx.dimension(function(d){return d.Priority; });
			  var piePriority = pieChartPriorityDimension.group();
			  
			  THIS.pieChartResolution = dc.pieChart("#pie-chart-Resolution");
			  var pieChartResolutionDimension = ndx.dimension(function(d){return d.Resolution; });
			  var pieResolution = pieChartResolutionDimension.group();
			  
			  THIS.pieChartComponents = dc.pieChart("#pie-chart-Components");
			  var pieChartComponentsDimension = ndx.dimension(function(d){return d.Components; });
			  var pieComponents = pieChartComponentsDimension.group();
			  
			  THIS.pieChartEpicTheme = dc.pieChart("#pie-chart-EpicTheme");
			  var pieChartEpicThemeDimension = ndx.dimension(function(d){return d.Epic_theme; });
			  var pieEpicTheme = pieChartEpicThemeDimension.group();
			  
			  THIS.rowChartAssignee = dc.pieChart("#row-Chart-Assignee");
			  var rowChartAssigneeDimension = ndx.dimension(function(d){return d.Assignee; });
			  var rowAssignee = rowChartAssigneeDimension.group();
			  
			  THIS.pieChartReporter = dc.pieChart("#pie-chart-Reporter");
			  var pieChartReporterDimension = ndx.dimension(function(d){return d.Reporter; });
			  var pieReporter = pieChartReporterDimension.group();
			  		  

			  THIS.horzBarChartProject = dc.rowChart("#row-chart-Project");
			  var barChartProjectDimension = ndx.dimension(function(d){return d.project; });
			  var barProject = barChartProjectDimension.group();
			  THIS.horzBarChartProject
			    .width(250).height(600)
			    .dimension(barChartProjectDimension)
			    .group(barProject)
			    .elasticX(true);
			  
			  THIS.timelineAreaChart1 = dc.lineChart("#timeline-area-chart1");
			  var timelineAreaChart1Dimension = ndx.dimension(function(d){return d.TimeSpent; });
			  var timelineAreaProject = timelineAreaChart1Dimension.group();
			  THIS.timelineAreaChart1
			    .width(250).height(300)
			    .dimension(barChartProjectDimension)
			    .group(barProject)
			    .elasticX(true);
			  
			  THIS.pieChartIssueType.width(170).height(150).radius(60)
			    .dimension(pieChartIssueTypeDimension)
			    .group(pieIssueType)
			    .renderlet(function (chart) {
			      //console.log(chart.filters());
			    });;
			  
			    THIS.pieChartStatus.width(170).height(150).radius(60)
			    .dimension(pieChartStatusDimension)
			    .group(pieStatus)
			    .renderlet(function (chart) {
			      //console.log(chart.filters());
			    });;
			  
			    THIS.pieChartFixVersions.width(170).height(150).radius(60)
			    .dimension(pieChartFixVersionsDimension)
			    .group(pieFixVersions)
			    .renderlet(function (chart) {
			      //console.log(chart.filters());
			    });;
			    
			    THIS.pieChartPriority.width(170).height(150).radius(60).innerRadius(30)
			    .dimension(pieChartPriorityDimension)
			    .group(piePriority)
			    .renderlet(function (chart) {
			      //console.log(chart.filters());
			    });;
			    
			    THIS.pieChartResolution.width(170).height(150).radius(60)
			    .dimension(pieChartResolutionDimension)
			    .group(pieResolution)
			    .renderlet(function (chart) {
			      //console.log(chart.filters());
			    });;
			    
			    THIS.rowChartAssignee
				  .width(170).height(150).radius(60)
				    .dimension(rowChartAssigneeDimension)
				    .group(rowAssignee);
				  
			    THIS.pieChartComponents.width(170).height(150).radius(60).innerRadius(30)
			    .dimension(pieChartComponentsDimension)
			    .group(pieComponents)
			    .renderlet(function (chart) {
			      //console.log(chart.filters());
			    });;
			    
			    THIS.pieChartEpicTheme.width(170).height(150).radius(60)
			    .dimension(pieChartEpicThemeDimension)
			    .group(pieEpicTheme)
			    .renderlet(function (chart) {
			    });;
			    
			    THIS.pieChartReporter
				  .width(170).height(150).radius(60)
				    .dimension(pieChartReporterDimension)
				    .group(pieReporter);
			  			    
		    THIS.pieChartIssueType.render();
		    THIS.pieChartStatus.render();
		    THIS.pieChartFixVersions.render();
		    THIS.pieChartPriority.render();
		    THIS.pieChartResolution.render();
		    THIS.pieChartComponents.render();
		    THIS.pieChartEpicTheme.render();
		    THIS.rowChartAssignee.render();
		    THIS.horzBarChartProject.render();
		    THIS.pieChartReporter.render();
		});
		/*var data = THIS.data;
		$("[id^=pie-chart] h4").addClass("hide");
		if (THIS.source == "JDE")
			$("#pie-chart-SalesGroup .axisLabel").html("Sales Territory");
		else
			$("#pie-chart-SalesGroup .axisLabel").html("Sales Group");

		var dateFormat = d3.time.format("%m/%d/%Y");

		data.forEach(function(d) {
			d.dd = dateFormat.parse(d.p);
			d.month = d3.time.month(d.dd);
			d.a = +d.a;
			d.m = +d.m;
			d.zz = (THIS.type == "netvalue") ? isNaN(d.m) ? 0 : d.m
					: isNaN(d.a) ? 0 : d.a;
		});

		var ndx = crossfilter(data);
		var all = ndx.groupAll();

		THIS.pieChartCompanyCode = dc.pieChart("#pie-chart-CompanyCode");
		var pieChartCompanyCodeDimension = ndx.dimension(function(d) {
			return (d.b || "Others") + "-" + (d.c || "Not Available");
		});
		var pieCompanyCode = pieChartCompanyCodeDimension.group();
		if (pieCompanyCode.size() > 1
				|| pieCompanyCode.all()[0].key.split("-")[0] != "Others") {
			pieCompanyCode = pieCompanyCode.reduceSum(
					function(d) {
						return d.zz;
					});
		} else {
			$("#pie-chart-CompanyCode h4").removeClass("hide");
			pieCompanyCode = pieCompanyCode.reduceSum(
					function() {
						return 0;
					});
		}
		
		
		THIS.pieChartDivision = dc.pieChart("#pie-chart-Division");
		var pieChartDivisionDimension = ndx.dimension(function(d) {

			return (d.h || "Others") + "-" + (d.i || "Not Available");
		});
		var pieDivision = pieChartDivisionDimension.group();
		if (pieDivision.size() > 1
				|| pieDivision.all()[0].key.split("-")[0] != "Others") {
			pieDivision = pieDivision.reduceSum(
					function(d) {
						return d.zz;
					});
		} else {
			$("#pie-chart-Division h4").removeClass("hide");
			pieDivision = pieDivision.reduceSum(
					function() {
						return 0;
					});
		}
		
		// for orderreason pie - begin
		
		THIS.pieChartOrderReason = dc.pieChart("#pie-chart-OrderReason");
		var pieChartOrderReasonDimension = ndx.dimension(function(d) {

			return (d.t || "Others") + "-" + (d.u || "Not Available");
		});
		var pieOrderReason = pieChartOrderReasonDimension.group();
		if (pieOrderReason.size() > 1
				|| pieOrderReason.all()[0].key.split("-")[0] != "Others") {
			pieOrderReason = pieOrderReason.reduceSum(
					function(d) {
						return d.zz;
					});
		} else {
			$("#pie-chart-OrderReason h4").removeClass("hide");
			pieOrderReason = pieOrderReason.reduceSum(
					function() {
						return 0;
					});
		}		
		
		// for orderreason pie - End	
		
		// for ordercategory pie - Start	
	
		THIS.pieChartOrderCategory = dc.pieChart("#pie-chart-OrderCategory");
		var pieChartOrderCategoryDimension = ndx.dimension(function(d) {

			return d.v|| "Others";
		});
		var pieOrderCategory = pieChartOrderCategoryDimension.group();
		if (pieOrderCategory.size() > 1
				|| pieOrderCategory.all()[0].key.split("-")[0] != "Others") {
			pieOrderCategory = pieOrderCategory.reduceSum(
					function(d) {
						return d.zz;
					});
		} else {
			$("#pie-chart-OrderCategory h4").removeClass("hide");
			pieOrderCategory = pieOrderCategory.reduceSum(
					function() {
						return 0;
					});
		}		
		
		// for ordercategory pie - End			
		
		THIS.pieChartPlant = dc.pieChart("#pie-chart-plant");
		var pieChartPlantDimension = ndx.dimension(function(d) {
			return (d.k || "Others") + "-" + (d.l || "Not Available");
		});
		var piePlant = pieChartPlantDimension.group();
		if (piePlant.size() > 1
				|| piePlant.all()[0].key.split("-")[0] != "Others") {
			piePlant = piePlant.reduceSum(function(d) {
				return d.zz;
			});
		}else {
			$("#pie-chart-plant h4").removeClass("hide");
			piePlant = piePlant.reduceSum(
					function() {
						return 0;
					});
		}
		
		THIS.pieChartMaterialType = dc.pieChart("#pie-chart-MaterialType");
		var pieChartMaterialTypeDimension = ndx.dimension(function(d) {
			return d.q || "Others";
		});
		var pieMaterialType = null; 
		if (pieChartMaterialTypeDimension.group().size() > 1
				|| pieChartMaterialTypeDimension.group().all()[0].key.split("-")[0] != "Others") {
			pieMaterialType = pieChartMaterialTypeDimension.group().reduceSum(
					function(d) {
						return d.zz;
					});
		} else{
			$("#pie-chart-MaterialType h4").removeClass("hide");
			pieMaterialType = pieChartMaterialTypeDimension.group().reduceSum(
					function() {
						return 0;
					});
		}
		
		THIS.pieChartSalesDocType = dc.pieChart("#pie-chart-Sales-Doc-Type");
		var pieChartSalesDocTypeDimension = ndx.dimension(function(d) {
			return (d.j || "Others") + "-" + (d.s || "Not Available");
		});
		var pieSalesDocType = null;
		if (pieChartSalesDocTypeDimension.group().size() > 1
				|| pieChartSalesDocTypeDimension.group().all()[0].key.split("-")[0] != "Others") {
			pieSalesDocType = pieChartSalesDocTypeDimension.group().reduceSum(
					function(d) {
						return d.zz;
					});
		} else {
			$("#pie-chart-Sales-Doc-Type h4").removeClass("hide");
			pieSalesDocType = pieChartSalesDocTypeDimension.group().reduceSum(
					function() {
						return 0;
					});
		}
		
		THIS.pieChartSalesOrg = dc.pieChart("#pie-chart-SalesOrg");
		var pieChartSalesOrgpDimension = ndx.dimension(function(d) {
			return (d.d || "Others") + "-" + (d.e || "Not Available");
		});
		var pieSalesOrg = pieChartSalesOrgpDimension.group();
		if (pieSalesOrg.size() > 1
				|| pieSalesOrg.all()[0].key.split("-")[0] != "Others") {
			pieSalesOrg = pieSalesOrg.reduceSum(
					function(d) {
						return d.zz;
					});
		} else {
			$("#pie-chart-SalesOrg h4").removeClass("hide");
			pieSalesOrg = pieSalesOrg.reduceSum(
					function() {
						return 0;
					});
		}
		
		THIS.pieChartSalesGroup = dc.pieChart("#pie-chart-SalesGroup");
		var pieChartSalesGroupDimension = ndx.dimension(function(d) {
			return (d.f || "Others") + "-" + (d.g || "Not Available");
		});
		var pieSalesGroup = pieChartSalesGroupDimension.group();
		if (pieSalesGroup.size() > 1
				|| pieSalesGroup.all()[0].key.split("-")[0] != "Others") {
			pieSalesGroup = pieSalesGroup.reduceSum(
				function(d) {
					return d.zz;
				});
		} else {
			$("#pie-chart-SalesGroup h4").removeClass("hide");
			pieSalesGroup = pieSalesGroup.reduceSum(
					function() {
						return 0;
					});
		}

		THIS.horzBarChart = dc.rowChart("#row-chart");
		THIS.timelineAreaChart = dc.lineChart("#timeline-area-chart");
		THIS.timelineChart = dc.barChart("#timeline-chart");

		var timelineDimension = ndx.dimension(function(d) {
			return d.month;
		});
		var timelineGroup = timelineDimension.group().reduceSum(function(d) {
			return d.zz;

		});

		var timelineAreaGroup = timelineDimension.group().reduce(
				function(p, v) {
					++p.count;
					if (isNaN(v.m))
						v.m = 0;
					p.total += v.m;// (v.open + v.close) / 2;
					return p;
				}, function(p, v) {
					--p.count;
					if (isNaN(v.m))
						v.m = 0;
					p.total -= v.m;// (v.open + v.close) / 2;
					return p;
				}, function() {
					return {
						count : 0,
						total : 0,
					};
				});

		// counts per weekday
		var horzBarDimension = ndx.dimension(function(d) {
			return d.r || "";
		});
		var horzBarGrp = horzBarDimension.group().reduceSum(function(d) {
			return d.zz;
		});

		THIS.pieChartCompanyCode.width(170).height(150).radius(60).dimension(
				pieChartCompanyCodeDimension).group(pieCompanyCode).label(
				function(d) {
					var companyCode = d.key.split("-");
					return companyCode[0];
				}).on('filtered', function(chart) {
			THIS.refreshTable(pieChartCompanyCodeDimension);
		}).title(
				function(d) {
					return THIS.type == "netvalue" ? d.key + ': $'
							+ numberFormat(d.value) : d.key + ': '
							+ numberFormat(d.value);
				});
		THIS.pieChartDivision.width(170).height(150).radius(60).innerRadius(30)
				.dimension(pieChartDivisionDimension).group(pieDivision).label(
						function(d) {
							var division = d.key.split("-");
							return division[0];
						}).on('filtered', function(chart) {
					THIS.refreshTable(pieChartDivisionDimension);
				}).title(
						function(d) {
							return THIS.type == "netvalue" ? d.key + ': $'
									+ numberFormat(d.value) : d.key + ': '
									+ numberFormat(d.value);
						});
		THIS.pieChartPlant.width(170).height(150).radius(60)
		// .colors(colorScale)
		.dimension(pieChartPlantDimension).group(piePlant).label(function(d) {
			var plantGroup = d.key.split("-");
			return plantGroup[0];
		}).on('filtered', function(chart) {
			THIS.refreshTable(pieChartPlantDimension);
		}).title(
				function(d) {
					return THIS.type == "netvalue" ? d.key + ': $'
							+ numberFormat(d.value) : d.key + ': '
							+ numberFormat(d.value);
				});
		THIS.pieChartSalesOrg.width(170).height(150).radius(60).innerRadius(30)
				.dimension(pieChartSalesOrgpDimension).group(pieSalesOrg)
				.label(function(d) {
					var purchaseOrg = d.key.split("-");
					return purchaseOrg[0];
				}).on('filtered', function(chart) {
					THIS.refreshTable(pieChartSalesOrgpDimension);
				}).title(
						function(d) {
							return THIS.type == "netvalue" ? d.key + ': $'
									+ numberFormat(d.value) : d.key + ': '
									+ numberFormat(d.value);
						});
		THIS.pieChartMaterialType.width(170).height(150).radius(60)
				.innerRadius(30).dimension(pieChartMaterialTypeDimension)
				.group(pieMaterialType).on('filtered', function(chart) {
					THIS.refreshTable(pieChartMaterialTypeDimension);
				}).title(
						function(d) {
							return THIS.type == "netvalue" ? d.key + ': $'
									+ numberFormat(d.value) : d.key + ': '
									+ numberFormat(d.value);
						});
		THIS.pieChartSalesDocType.width(170).height(150).radius(60)
				.innerRadius(30).dimension(pieChartSalesDocTypeDimension)
				.group(pieSalesDocType).on('filtered', function(chart) {
					THIS.refreshTable(pieChartSalesDocTypeDimension);
				}).label(function(d) {
					var name = d.key.split("-");
					return name[0];
				}).title(
						function(d) {
							return THIS.type == "netvalue" ? d.key + ': $'
									+ numberFormat(d.value) : d.key + ': '
									+ numberFormat(d.value);
						});
		THIS.pieChartSalesGroup.width(170).height(150).radius(60).dimension(
				pieChartSalesGroupDimension).group(pieSalesGroup).label(
				function(d) {
					var purchaseGrp = d.key.split("-");
					return purchaseGrp[0];
				}).on('filtered', function(chart) {
			THIS.refreshTable(pieChartSalesGroupDimension);
		}).title(
				function(d) {
					return THIS.type == "netvalue" ? d.key + ': $'
							+ numberFormat(d.value) : d.key + ': '
							+ numberFormat(d.value);
				});

		THIS.pieChartMaterialType.width(170).height(150).radius(60)
		.innerRadius(30).dimension(pieChartMaterialTypeDimension)
		.group(pieMaterialType).on('filtered', function(chart) {
			THIS.refreshTable(pieChartMaterialTypeDimension);
		}).title(
				function(d) {
					return THIS.type == "netvalue" ? d.key + ': $'
							+ numberFormat(d.value) : d.key + ': '
							+ numberFormat(d.value);
				});
		THIS.pieChartOrderReason.width(170).height(150).radius(60)
		.innerRadius(30).dimension(pieChartOrderReasonDimension).label(
				function(d) {
					var purchaseGrp = d.key.split("-");
					return purchaseGrp[0];
				})
		.group(pieOrderReason).on('filtered', function(chart) {
			THIS.refreshTable(pieChartOrderReasonDimension);
		}).title(
				function(d) {
					return THIS.type == "netvalue" ? d.key + ': $'
							+ numberFormat(d.value) : d.key + ': '
							+ numberFormat(d.value);
				});
		
		
		THIS.pieChartOrderCategory.width(170).height(150).radius(60)
		.innerRadius(30).dimension(pieChartOrderCategoryDimension).label(
				function(d) {
					var purchaseGrp = d.key.split("-");
					return purchaseGrp[0];
				})
		.group(pieOrderCategory).on('filtered', function(chart) {
			THIS.refreshTable(pieChartOrderCategoryDimension);
		}).title(
				function(d) {
					return THIS.type == "netvalue" ? d.key + ': $'
							+ numberFormat(d.value) : d.key + ': '
							+ numberFormat(d.value);
				});
		
		// #### Row Chart
		THIS.horzBarChart.width(180).height(700).margins({
			top : 20,
			left : 10,
			right : 10,
			bottom : 20
		}).group(horzBarGrp).dimension(horzBarDimension).on('filtered',
				function(chart) {
					THIS.refreshTable(horzBarDimension);
				})
		// assign colors to each value in the x scale domain
		.ordinalColors(
				[ '#3182bd', '#6baed6', '#9e5ae1', '#c64bef', '#da8aab' ])
				.label(function(d) {

					return d.key;// .split(".")[1];
				})
				// title sets the row text
				.title(
						function(d) {
							return THIS.type == "netvalue" ? d.key + ': $'
									+ numberFormat(d.value) : d.key + ': '
									+ numberFormat(d.value);
						}).elasticX(true).xAxis().ticks(4);

		THIS.timelineAreaChart.renderArea(true).width($('#content').width())
				.height(150).transitionDuration(1000).margins({
					top : 30,
					right : 70,
					bottom : 25,
					left : 80
				}).dimension(timelineDimension).mouseZoomable(true).rangeChart(
						THIS.timelineChart).x(
						d3.time.scale()
								.domain(
										[ new Date(2011, 0, 1),
												new Date(2015, 11, 31) ]))
				.round(d3.time.month.round).xUnits(d3.time.months).elasticY(
						true).renderHorizontalGridLines(true).brushOn(false)
				.group(timelineAreaGroup, "Vendor Count").valueAccessor(
						function(d) {
							return d.value.total;
						}).on('filtered', function(chart) {
					THIS.refreshTable(timelineDimension);
				})
				// .stack(timelineSecondGroup, "Material Count", function(d)
				// {
				// return d.value;
				// })
				// title can be called by any stack layer.
				.title(function(d) {
					var value = d.value.total;
					if (isNaN(value))
						value = 0;
					return dateFormat(d.key) + "\n$" + numberFormat(value);
				});

		THIS.timelineChart.width($('#content').width()).height(80).margins({
			top : 40,
			right : 70,
			bottom : 20,
			left : 80
		}).dimension(timelineDimension).group(timelineGroup).centerBar(true)
				.gap(1).x(
						d3.time.scale()
								.domain(
										[ new Date(2011, 0, 1),
												new Date(2015, 11, 31) ]))
				.round(d3.time.month.round).alwaysUseRounding(true).xUnits(
						d3.time.months);
		dc.dataCount(".dc-data-count").dimension(ndx).group(all);

		var dataTableData = data.slice(0, 100);
		THIS.dataTable = $(".dc-data-table")
				.DataTable(
						{
							"sDom" : "<'dt-top-row'Tlf>r<'dt-wrapper't><'dt-row dt-bottom-row'<'row'<'col-sm-6'i><'col-sm-6 text-right'p>>",
							"bProcessing" : true,
							"bLengthChange" : true,
							"bSort" : true,
							"bInfo" : true,
							"bJQueryUI" : false,
							"scrollX" : true,
							"aaData" : dataTableData,
							"oTableTools" : {
								"aButtons" : [ {
									"sExtends" : "collection",
									"sButtonText" : 'Export <span class="caret" />',
									"aButtons" : [ "csv", "pdf" ]
								} ],
								"sSwfPath" : "js/plugin/datatables/media/swf/copy_csv_xls_pdf.swf"
							},
							"bDestroy" : true,
							"processing" : true,
							"aoColumns" : [
									{
										"mDataProp" : null,
										"sDefaultContent" : '<img src="./img/details_open.png">'
									}, {
										"mDataProp" : "a",
										"sDefaultContent" : "0",										
										"sClass" : "numbercolumn"
									}, {
										"mDataProp" : "b",
										"sDefaultContent" : "",
									}, {
										"mDataProp" : "h",
										"sDefaultContent" : "",
									}, {
										"mDataProp" : "k",
										"sDefaultContent" : "",
									}, {

										"mData" : "q",
										"sDefaultContent" : ""
									}, {
										"mDataProp" : "j",
										"sDefaultContent" : "",
									}, {
										"mDataProp" : "d",
										"sDefaultContent" : "",
									}, {
										"mDataProp" : "f",
										"sDefaultContent" : "",
									}, {
										"mDataProp" : "m",
										"sDefaultContent" : "0",
										"mRender" : function(data, type, full) {
											if (isNaN(data))
												data = 0;
											return numberFormat(data);
										},
										"sClass" : "numbercolumn"
									}, {
										"mDataProp" : "r",
										"sDefaultContent" : "",
									}, {
										"mDataProp" : "p",
										"sClass" : "numbercolumn",
										"sDefaultContent" : ""
									}, ],
							"fnRowCallback" : function(nRow, aData,
									iDisplayIndex, iDisplayIndexFull) {
								var request = {
									"viewType" : "level2",
									"source" : aData.n || "null",
									"companyCode" : aData.b || "null",
									"plant" : aData.k || "null",
									"salesOrg" : aData.d || "null",
									"salesType" : aData.j || "null",
									"salesGroup" : aData.f || "null",
									"soType" : aData.r || "null",
									"materialType" : aData.q || "null",
									"lastChangeDate" : aData.p || "null",
									"division" : aData.h || "null",
									"region" : "CAN",
									"customerId" : "null"
								};
								
								 * private String soCount; a private String
								 * companyCode; b private String companyName; c
								 * private String salesOrg; d private String
								 * salesOrgName; e private String salesGroup; f
								 * private String salesGroupName; g private
								 * String division; h private String
								 * divisionName; i private String salesDocType;
								 * j private String plantGroup; k private String
								 * plantName; l private String netValue; m
								 * private String source; n private String
								 * region; o private String lastChanged; p
								 * private String materialType; q private String
								 * soType; r
								 
								$(nRow).attr({
									"id" : "row" + iDisplayIndex
								}).unbind('click').bind('click', request,
										soProfiling.callLevel2soProfile);
							}
						});
*/		dc.renderAll();
	};

	this.callLevel2soProfile = function(request) {
		var tr = $(this).closest('tr');
		THIS.childId = "child" + $(tr).attr("id");
		if ($(tr).find('td:eq(0)').hasClass("expandRow")) {
			$($(tr).find('td:eq(0)').find('img')).attr('src',
					'./img/details_open.png');
			$("#" + THIS.childId).hide(50);
		} else {

			$($(tr).find('td:eq(0)').find('img')).attr('src',
					'./img/details_close.png');
			if (!$(tr).next().hasClass("childRowtable")) {
				$(tr).after($("<tr/>").addClass("childRowtable").attr({
					"id" : THIS.childId
				}).append($("<td/>")).append($("<td/>").attr({
					"colspan" : "13",
					"id" : THIS.childId + "td"
				}).addClass("carousel")));

				//enableLoading(THIS.childId + "td", "50%", "45%");
				request = request.data;
				callAjaxService("JiraProfile", function(response) {
					callbackSucessLevel2SOProfile(response, request);
				}, callBackFailure, request, "POST");
			} else {
				$("#" + THIS.childId).show(50);
			}
		}
		$(tr).find('td:eq(0)').toggleClass("expandRow");
	};

	var callbackSucessLevel2SOProfile = function(response, request) {
		//disableLoading(THIS.childId + "td");
		if (response && response.isException){
			showNotification("error",response.customMessage);
			return;
		}
		var childTabledata = null;
		if (response != null)
			childTabledata = response["level2SalesOrderList"];
		$("#" + THIS.childId + "td")
				.show()
				.html("")
				.append(
						$("<table/>")
								.addClass("table table-hover dc-data-table")
								.attr({
									"id" : THIS.childId + "Table"
								})
								.append(
										$("<thead/>")
												.append(
														$("<tr/>")
																.append(
																		$(
																				"<th/>")
																				.html(
																						"Sales Order"))
																.append(
																		$(
																				"<th/>")
																				.html(
																						"Material #"))
																.append(
																		$(
																				"<th/>")
																				.html(
																						"Customer ID"))
																.append(
																		$(
																				"<th/>")
																				.html(
																						"Customer Name"))
																.append(
																		$(
																				"<th/>")
																				.html(
																						"Plant Name"))
																.append(
																		$(
																				"<th/>")
																				.html(
																						"Line Item"))
																.append(
																		$(
																				"<th/>")
																				.html(
																						"Net Value")))));

		$("#" + THIS.childId + "Table")
				.DataTable(
						{
							"sDom" : "<'dt-top-row'Tlf>r<'dt-wrapper't><'dt-row dt-bottom-row'<'row'<'col-sm-6'i><'col-sm-6 text-right'p>>",
							"bProcessing" : true,
							"bLengthChange" : true,
							// "bServerSide": true,
							"bInfo" : true,
							"bFilter" : false,
							"bJQueryUI" : false,
							"aaData" : childTabledata,
							"scrollX" : true,
							"oTableTools" : {
								"aButtons" : [ {
									"sExtends" : "collection",
									"sButtonText" : 'Export <span class="caret" />',
									"aButtons" : [ "csv", "pdf" ]
								} ],
								"sSwfPath" : "js/plugin/datatables/media/swf/copy_csv_xls_pdf.swf"
							},
							"aoColumns" : [ {
								"mDataProp" : "salesDoc",
								"sDefaultContent" : ""
							}, {
								"mDataProp" : "materialNumber",
								"sDefaultContent" : ""
							}, {
								"mDataProp" : "customerId",
								"sDefaultContent" : ""
							}, {
								"mDataProp" : "customerName",
								"sDefaultContent" : ""
							}, {
								"mDataProp" : "plantName",
								"sDefaultContent" : ""
							}, {
								"mDataProp" : "salesItem",
								"sDefaultContent" : ""
							}, {
								"mDataProp" : "netValue",
								"sDefaultContent" : "",
								"mRender" : function(data, type, full) {
									return numberFormat(data);
								},
								"sClass" : "numbercolumn"
							} ],
							"fnRowCallback" : function(nRow, aData,
									iDisplayIndex, iDisplayIndexFull) {
								$(nRow)
										.attr(
												{
													'onClick' : "javascript:thirdLevelDrillDownSO('', '"
															+ aData.salesDoc
															+ "','100','"
															+ request.source
															+ "')",
													'data-target' : '#myModalthredlevel',
													'data-toggle' : 'modal'
												});
							}
						});
	};
	this.refreshTable = function(dim) {

		if (THIS.dataTable !== null && dim !== null) {
			THIS.dataTable.fnClearTable();
			THIS.dataTable.fnAddData(dim.top(100));
			THIS.dataTable.fnDraw();
		} else
			console
					.log('[While Refreshing Data Table] This should never happen..');
	};
	d3.selectAll("#version").text(dc.version);

	/*
	 * var config = { endpoint : 'soprofile', dataKey:
	 * 'aggregatedSalesOrderList', dataType: 'json', dataPreProcess: function(d) {
	 * d.dd = dateFormat.parse(d.p); d.month = d3.time.month(d.dd); d.a = +d.a;
	 * d.m = +d.m; }, mappings : [{ chartType : 'pie', htmlElement:
	 * '#pie-chart-CompanyCode', field: 'companycode', resetHandler: "#resetCC"
	 * },{ chartType : 'pie', htmlElement: '#pie-chart-plant', field:
	 * 'accgroup', groupon: 'glamount', groupRound: true, resetHandler:
	 * "#resetPlant" },{ chartType : 'pie', htmlElement: '#pie-chart-Division',
	 * field: 'tradpartner', groupon: 'glamount', groupRound: true,
	 * resetHandler: "#resetDiv" },{ chartType : 'pie', htmlElement:
	 * '#pie-chart-MaterialType', field: 'userid', groupon: 'glamount',
	 * groupRound: true, resetHandler: "#resetMT" },{ chartType : 'pie',
	 * htmlElement: '#pie-chart-Sales-Doc-Type', field: 'tcode', groupon:
	 * 'glamount', groupRound: true, resetHandler: "#resetDT" },{ chartType :
	 * 'pie', htmlElement: '#pie-chart-SalesOrg', field: 'tcode', groupon:
	 * 'glamount', groupRound: true, resetHandler: "#resetSO" },{ chartType :
	 * 'pie', htmlElement: '#pie-chart-SalesGroup', field: 'tcode', groupon:
	 * 'glamount', groupRound: true, resetHandler: "#resetSG" },{ chartType :
	 * 'horbar', htmlElement: '#row-chart', field: 'doctype', resetHandler:''
	 * },{ chartType : 'timeline', htmlElement: '#timeline-area-chart',
	 * subHtmlElement: '#timeline-chart', field: 'month', group: 'glamount',
	 * resetHandler:'#resetTAC', mapFunction:function(p, v) { ++p.count; if
	 * (isNaN(v.m)) v.m = 0; p.total += v.m;// (v.open + v.close) / 2; return p; },
	 * reduceFunction : function(p, v) { --p.count; p.total -= v.netprice;//
	 * (v.open + v.close) / 2; return p; }, countFunction: function() { return {
	 * count : 0, total : 0 }; } },{ chartType : 'table', htmlElement:
	 * '.dc-data-table', field: 'date', groupon: 'companycode', coloums:
	 * 'date,a, b,h,k,q,j,d,f,m,r,p', sortby: 'companycode', summarydiv :
	 * '.dc-data-count', renderlet: 'dc-table-group', resetHandler:'#resetRC' }] };
	 */

	// var sop = new Profiling(config);
	// sop.init(function(){
	// $('#loading').hide();
	// });
};
soProfileInstance();