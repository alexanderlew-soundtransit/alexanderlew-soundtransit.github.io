// JavaScript Document


//load menus: create drop down menus of route, directions, day of service

//config settings

//config 

var configFiles = new Array();

var configIgnoreStopsEndPoint = 'https://raw.githubusercontent.com/alexanderlew-soundtransit/alexanderlew-soundtransit.github.io/main/data/configIgnoreStops.csv';

var configIgnoreStops;

var stopNameExceptionsEndPoint = 'https://raw.githubusercontent.com/alexanderlew-soundtransit/alexanderlew-soundtransit.github.io/main/data/stop_name_exceptions.csv';
var stopNameExceptions;

var configTransfersEndPoint = 'https://raw.githubusercontent.com/alexanderlew-soundtransit/alexanderlew-soundtransit.github.io/main/data/configTransfers.csv';
var configTransfers;


var configTripSortExceptionsEndPoint = 'https://raw.githubusercontent.com/alexanderlew-soundtransit/alexanderlew-soundtransit.github.io/main/data/configTripSortExceptions.csv';
var tripSortExceptions; 


var configDataEndPoint = 'https://raw.githubusercontent.com/alexanderlew-soundtransit/alexanderlew-soundtransit.github.io/main/data/configDataEndpoints.csv';


//cheap work around for better sort of stops. 
var stopSeqExceptions = [
{route_id: "535", direction_name: "South", stop_seq_adjust: 10},
];

// minimum connection time for Link in minutes
var minConnect = 4;

//TO DO: Load table of all endpoints. 1. create menu of service change periods, then filter data 


var revTripsData = [];

//load exceptions first, then data
loadStopNameExceptionsCSV(stopNameExceptionsEndPoint);


//Function to load all schedule data. 
function loadData() {
	console.log("loading data");
	// loading data: 
	
	
	
	//clear data cache
	revTripsData = new Array();
	
	var loop = 0;
	var lastLoop = configFiles.length;
	console.log(lastLoop);
	
	loadCSV();
		
	function loadCSV() {
	
			d3.csv(configFiles[loop], function(data){
				
				console.log("Cleaning up " + configFiles[loop]);
				
				//clean up data: organize by route, direction, and trip.
				
				//filter out all deadheading trips 
				var cleanedData = data.filter(function(d){
					return (d.route_id !== "" && d.route_id !== null)	
					});
				
				
				//clean data
				cleanedData = cleanData(cleanedData);	
				
				Array.prototype.push.apply(revTripsData, cleanedData);
				
				loop++;
				console.log("loop complete, calling function again");
				if(loop < lastLoop){
					loadCSV();
				} else {
					document.getElementById("status").innerHTML = "";
					loadDirectionMenu();	
				}
				
			});	 
	}
	
	
	
}

//sequentially call configs 

function loadStopNameExceptionsCSV(endpoint){
	d3.csv(endpoint, function(data){
		stopNameExceptions = data;
		
		loadConfigTripSortExceptions(configTripSortExceptionsEndPoint);	
	});
}

function loadConfigTripSortExceptions(endpoint){
	d3.csv(endpoint, function(data){
		tripSortExceptions = data;
		
		loadConfigTransfers(configTransfersEndPoint);	
	});
	
	
}

function loadConfigTransfers(endpoint){
	d3.csv(endpoint, function(data){
		configTransfers = data;
		
	//call next
	loadConfigIgnoreStops(configIgnoreStopsEndPoint);	
		
	});
}

function loadConfigIgnoreStops(endpoint){
	d3.csv(endpoint, function(data){
		configIgnoreStops = data;
		
		loadServicePeriods(configDataEndPoint);
	});
	
}

//gets selected service period, loads data for that specific period. 
function loadServicePeriods(endpoint){
	d3.csv(endpoint, function(data){
		
		var servicePeriodMenu ='';
		
		var servicePeriods = [];
		//get all unique service periods listed in config filer.
		data.forEach(function(d){
			servicePeriods.push(d.service_change);
			
		});
		//only unique
		servicePeriods = servicePeriods.filter(function(value,index,self){
			
			return self.indexOf(value) === index;
		});
		
		servicePeriods = servicePeriods.sort().reverse();
		
		servicePeriods.forEach(function(d){
		servicePeriodMenu += '<option value="' + d + '">' + d + '</option>';
		
		});

		
		document.getElementById("select-period").innerHTML = servicePeriodMenu;
		
		//call next function
		loadDataEndpointsList(configDataEndPoint);
			
	});
	
	
}

function loadDataEndpointsList(endpoint){
	
	//get selected menu 
	var selectedServicePeriod = document.getElementById("select-period");
	var valueServicePeriod = selectedServicePeriod.options[selectedServicePeriod.selectedIndex].value;

	
	d3.csv(endpoint, function(data){
		//filter only to selected service periods
		servicePeriodEndPoints = data.filter(function(d){
			return d.service_change === valueServicePeriod;
			
		});
		
		//reset endpoints array
		configFiles =[];
		
		//push to config
		servicePeriodEndPoints.forEach(function(d){
			configFiles.push(d.url_endpoint);
			
		});
		
			
	//call next function
	//last config loaded; load all schedule data 
		loadData();	
		
	});
}






function buildSchedules(){
	var selectedRoute  = document.getElementById("select-route");
	var valueRoute = selectedRoute.options[selectedRoute.selectedIndex].value;
	
	if(valueRoute.includes("-")){
		//push both routes into schedule.
		var routeArray = valueRoute.split("-");
		
		valueRoute = routeArray;
	}
	
	
	
	var selectedDirection = document.getElementById("select-direction");
	var valueDirection = selectedDirection.options[selectedDirection.selectedIndex].value;
	
	var selectedServiceId = document.getElementById("select-service-id");
	var valueServiceId = selectedServiceId.options[selectedServiceId.selectedIndex].value;
	
	
	displayTable(valueRoute, valueServiceId, valueDirection, revTripsData);
		
}


function cleanData(data){
	//clean up data by removing extraneous spaces; converting time formats, etc. 
		for (var i = 0; i < data.length; i++){
			
			data[i].route_id = data[i].route_id.replace(/\s+/g, ' ').trim();
			//check if stop should be ignored.
			if(configIgnoreStops.filter(function(d){return d.stop_id === data[i].stop_id && d.route_id === data[i].route_id}).length > 0){
				continue;
			}
			else{
				data[i].service_id = data[i].service_id.replace(/\s+/g, ' ').trim();
				
				data[i].sch_arr_time = data[i].sch_arr_time.replace(/\s+/g, ' ').trim();
				data[i].stop_seq = +data[i].stop_seq.replace(/\s+/g, ' ').trim(); //converts to number
				
				data[i].block_id = data[i].block_id.replace(/\s+/g, ' ').trim()
				data[i].trip_id = data[i].trip_id.replace(/\s+/g, ' ').trim();
				
				//if link, convert trip_id to number. 
				if(data[i].route_id === 'S599'){
					data[i].trip_id = +data[i].trip_id;
				}
				
				data[i].sch_arr_time_sort = +data[i].sch_arr_time.replace(":","");
				
				//check for stop name exceptions: 
				var stopExceptions = stopNameExceptions.filter(function(d){
					return data[i].stop_id === d.stop_id;});
				
				//correct stop data with stop name corrections:
				if(stopExceptions.length > 0){

					
					var replaceStopName;
					
					
					// first check for all route and directions
					
					var replaceAllRoutesDirections = stopExceptions.filter(function(d){
						return (d.route_id === "" || d.route_id === null) && (d.direction_name === "" || d.direction_name === null);
					});
					
					//then check for all routes and single direction
					var replaceAllRoutesOneDirection = stopExceptions.filter(function(d){
						return (d.route_id === "" || d.route_id === null) && (d.direction_name === data[i].direction_name);
					});
					
					//check for single route, all directions
					var replaceOneRouteAllDirections = stopExceptions.filter(function(d){
						return (d.route_id === data[i].route_id) && (d.direction_name === "" || d.direction_name === null);
					});
					
					//check for single route and one direction.
					
					var replaceOneRouteOneDirection = stopExceptions.filter(function(d){
						return (d.route_id === data[i].route_id) && (d.direction_name === data[i].direction_name);
					});
					
					
					if(replaceOneRouteOneDirection.length > 0){
						data[i].stop_name_display = replaceOneRouteOneDirection[0].stop_name;		
					}
					else if(replaceOneRouteOneDirection.length < 1 && replaceOneRouteAllDirections.length > 0){
						data[i].stop_name_display = replaceOneRouteAllDirections[0].stop_name;	
					}
					else if(replaceOneRouteOneDirection.length < 1 && replaceOneRouteAllDirections.length < 1 && replaceAllRoutesOneDirection.length > 0){
					 	data[i].stop_name_display = replaceAllRoutesOneDirection[0].stop_name;
					}
					else if(replaceOneRouteOneDirection.length < 1 && replaceOneRouteAllDirections.length < 1 && replaceAllRoutesOneDirection.length < 1 && replaceAllRoutesDirections.length > 0){
						data[i].stop_name_display = replaceAllRoutesDirections[0].stop_name;
					}
							
				}
				
				//Link: replace stop_id with stop_name as a cheep workaround for parent stops 
				if(data[i].route_id === 'S599'){
					data[i].stop_id = data[i].stop_name;	
				}
	
				var adjustStopSeq = stopSeqExceptions.filter(function(d){return data[i].route_id === d.route_id && data[i].direction_name === d.direction_name;});
				
				if(adjustStopSeq.length >0){
					data[i].stop_seq += adjustStopSeq[0].stop_seq_adjust;	
				}
				
				//add fields: 24h time
				var sch_arr_time_cleaned;
				
				if((data[i].sch_arr_time.substring(0, data[i].sch_arr_time.indexOf(':'))) >= 24){
					sch_arr_time_cleaned = data[i].sch_arr_time.substring(0, data[i].sch_arr_time.indexOf(':'))-24;
					//sch_arr_time_cleaned += ":";
					sch_arr_time_cleaned += data[i].sch_arr_time.substring(data[i].sch_arr_time.indexOf(':'),data[i].sch_arr_time.length);	}
				else{
					sch_arr_time_cleaned = data[i].sch_arr_time;
					}
				
				data[i].sch_arr_time_24h = sch_arr_time_cleaned;	
			}
		}
		
	//for Link: filter out non-revenue trips
	var dataCleaned = data.filter(function(d){
		return d.route_id !== 'S599' || (d.route_id ==='S599' && d.trip_id > 999);
	});
		
	return dataCleaned;
}

//function returns array of all routes. 
function generateAllRoutes(data){
	
	allRoutes = [];
	
	for (var i = 0; i < data.length; i++){
		if(allRoutes.includes(data[i].route_id) === false){
			allRoutes.push(data[i].route_id);
		}	
	}
	return allRoutes;
}

//function returns list of stops for selected routes, ordered by max stop seq and direction
function generateStopsByRoute(data, route, directionName, serviceId){
		
	var routeData = [];
	if(!Array.isArray(data)){
		 routeData = data.filter(function(d){
			return d.route_id === route;
		});
	}
	else if(Array.isArray(data)){
		routeData = data.filter(function(d){
			return route.includes(d.route_id);
		});
	}
	
	routeData = routeData.filter(function(d){
		return d.direction_name === directionName && d.service_id === serviceId;
	});
	
	
	var stops = [];
	
	//loop through each stop time stop_seq and stop_name and find max seq.
	for(var i = 0; i < routeData.length; i++){
		//if stop does not exist, add to array
		
		
		if(stops.filter(function(d){return d.stop_id === routeData[i].stop_id && d.stop_name === routeData[i].stop_name}).length < 1){
				//add object
			var obj = {};
		
			obj["stop_name"] = routeData[i].stop_name;
			obj["stop_name_display"] = routeData[i].stop_name_display;
			obj["stop_id"] = routeData[i].stop_id;
			obj["direction_name"] = routeData[i].direction_name;
			obj["max_stop_seq"] = routeData[i].stop_seq;
			
			stops.push(obj);
			}
		else{//if stop does exist, check max stop seq, if new one is greater, updat max stop seq
			//loop through and update
			for(var j = 0; j < stops.length; j++){
				if(stops[j].stop_name === routeData[i].stop_name && stops[j].stop_id === routeData[i].stop_id 
				&& stops[j].direction_name === routeData[i].direction_name && stops[j].max_stop_seq < routeData[i].stop_seq ){
					//update
					stops[j].max_stop_seq = routeData[i].stop_seq;
				}
			}
				
		}
		
	
	}
	
	stops.sort(function(a,b){
		if(a.direction_name < b.direction_name){
			return -1;
		} else if(a.direction_name > b.direction_name){
			return 1;	
		} 
		else {
		
			if(a.max_stop_seq > b.max_stop_seq){
				return 1;	
			} else if(a.max_stop_seq < b.max_stop_seq){
				return -1;	
			} else {
				return 0;
			}
			
		}
	});
	
	return stops;		
	
}



function displayTable(routes, service_id, directionName, data){
	//get stops by routes
	var stopsByRoute = generateStopsByRoute(data, routes, directionName, service_id);
	
	
	
	//create header
	var tableHeader = "<thead><tr>";
	tableHeader += '<th scope="col">' + 'Route' + '</th>' 
	
	//check if checkbox is checked to show trip id or block id
	
	var checkBoxTrip = document.getElementById("showTripIdCheckbox");
	var showTripId;
	
	if(checkBoxTrip.checked === true){
		showTripId = true;
	}
	else {
		showTripId = false;	
	}
	
	var checkBoxBlock = document.getElementById("showBlockIdCheckbox");
	var showBlockId;
	
	if(checkBoxBlock.checked === true){
		showBlockId = true;
	}
	else {
		showBlockId = false;	
	}
	
	
	
	
	// add to table trip and block column headers
	
	if(showTripId === true){
		tableHeader += '<th scope="col">' + 'Trip ID' + '</th>'; 	
	}
	if(showBlockId === true){
		tableHeader += '<th scope="col">' + 'Block ID' + '</th>'; 	
	}
	
	
	
	//connection from Link //check if route is in config. 
	//load config value to see if it includes route
	var configTransfersRouteBothDirections = configTransfers.filter(function(d){
		return routes.includes(d.route_id);
	});
	
	//loop through each, and check if there is a connection TO route in the direction that is selected. 
	if(configTransfersRouteBothDirections){
		var configTransfersToRoute = configTransfersRouteBothDirections.filter(function(d){
			return directionName === d.ob_direction_id;
		});
		
		if(configTransfersToRoute.length > 0){
			tableHeader += '<th scope="col">' + '1 Line Arrival' + '</th>' ;
		}
	}
	
	
	
	stopsByRoute.forEach(function(d){
		
		var displayStop;
		
		if(d.stop_name_display === "" && d.stop_name === ""){
			displayStop = d.stop_id;
		} else if(d.stop_name_display) {
			displayStop = d.stop_name_display;// +' (' + d.stop_id + ')';			
		}
		else {
			displayStop = d.stop_name; // +' (' + d.stop_id + ')';
		}
		tableHeader += '<th scope="col">' + displayStop + '</th>'; 
	});
	
	//display header for link connection
	if(configTransfersRouteBothDirections){
		var configTransfersFromRoute = configTransfersRouteBothDirections.filter(function(d){
			return directionName === d.ib_direction_id;
		});
		
		
		if(configTransfersFromRoute.length > 0){
			tableHeader += '<th scope="col">' + '1 Line Departure' + '</th>' ;
		}
	}
	//connections to Link
	
	tableHeader += "</tr></thead>";
	
	
	
	//populate body:
	var tableBody = '<tbody><tr>';
	//for each trip populat ethe table in the order of the headers.
	var allTrips = getTripsByRoutes(routes, service_id, data);
	
	allTrips = allTrips.filter(function(d){
		return d.direction_name === directionName;
	});
	
	//TO DO: sort by stop
	//check if tripSortExceptions exist.
	
	//if exists, sort by the stop for that particular direction.
	
	
	for (var t = 0; t < allTrips.length; t++){
		tableBody += '<td>' + allTrips[t].route_id.replace("S5","5") + '</td>';
		
		if(showTripId === true){
			tableBody +=	 '<td>' + allTrips[t].trip_id + '</td>';
		}
		//block
		if(showBlockId === true){
			tableBody +=	 '<td>' + allTrips[t].block_id + '</td>';
		}
		
		
		//get config for this single trip. 
		var transferToRoute = configTransfersToRoute.filter(function(d){
			return d.route_id === allTrips[t].route_id;	
		});

		
				//find connection time FROM Link TO route
		
		//for schedules with multiple routes but not all with link connectiion, add ":" for the link connection field. 
		if(configTransfersToRoute.length > 0 && transferToRoute.length === 0){
			tableBody +=	'<td>:</td>';
			//all other connection times:
		} else if(transferToRoute.length > 0){
			//get stop time for route and then call function to find closest Link arrival time.
			var connectionStop = allTrips[t].stops.filter(function(d){
				return d.stop_id === transferToRoute[0].ob_stop_id;
			});
			
			//if trip doesn't serve stop: show "":"
			if(connectionStop.length < 1){
				tableBody +=	'<td>:</td>';		
			}
			else{
			// call function
				var connectionTime = getConnectionToFromRoute(connectionStop[0].sch_arr_time_24h,transferToRoute[0].from_route_id,transferToRoute[0].from_stop_id,transferToRoute[0].from_direction_name,service_id,"to");
				
				
				if(connectionTime){
					var formattedConnectionTime = moment(connectionTime,"h:mm").format("h:mm a");
					tableBody +='<td>' + formattedConnectionTime + '</td>';
				}
			}
	
			
		}
		
		//get each stop and find stop time by looping through stop listing each time
		for(var i = 0; i < stopsByRoute.length; i++){
			
			
			var stopsFiltered = allTrips[t].stops.filter(function(d){return d.stop_id === stopsByRoute[i].stop_id && d.stop_name === stopsByRoute[i].stop_name; });
			
			var stopsFilteredLength = stopsFiltered.length;
			//take the latest if there are multiple stop times for a single stop/trip
			
			//if there is more than one stop results, then sort by time asc
			if(stopsFilteredLength > 1){
				stopsFiltered = stopsFiltered.sort(function(a,b){
					return a.stop_arr_time_sort - b.stop_arr_time_sort;
				});
			}
			
			if(stopsFilteredLength > 0){
				var stopTime = moment(stopsFiltered[stopsFilteredLength-1].sch_arr_time_24h,'h:mm').format('h:mm a');
				tableBody += '<td>' + stopTime + '</td>'; 
			}
			else{ 
				tableBody +=	'<td>:</td>';
			}
			
		}
		/*
			//get connection to Link time. 
			
			*/ 
			var transferFromRoute = configTransfersFromRoute.filter(function(d){
					return d.route_id === allTrips[t].route_id;	
				});
			
			//handling for multiple routes on one schedule but one doesnt connect to link:
			if(configTransfersFromRoute.length > 0 && transferFromRoute.length === 0){
			tableBody +=	'<td>:</td>';
			} 
			//all other connection times:
			else if(transferFromRoute.length > 0){
			//get stop time for route and then call function to find closest Link arrival time.
			var connectionStop = allTrips[t].stops.filter(function(d){
				return d.stop_id === transferFromRoute[0].ib_stop_id;
			});
			

			//if trip doesn't serve stop then: show "":"
			if(connectionStop.length < 1){
				tableBody +=	'<td>:</td>';		
			}
			else{
			// call function
				var connectionTime = getConnectionToFromRoute(connectionStop[0].sch_arr_time_24h,transferFromRoute[0].to_route_id,transferFromRoute[0].to_stop_id,transferFromRoute[0].to_direction_name,service_id,"from");
				

				
				if(connectionTime){
					var formattedConnectionTime = moment(connectionTime,"h:mm").format("h:mm a");
					tableBody +='<td>' + formattedConnectionTime + '</td>';
				}
				else{
					tableBody +='<td>:</td>';
				}
			}
	
			
				
		}
		
		//d.stops.forEach(function(e){
	
		tableBody += '</tr>';
	}
	
	tableBody += '</tbody>';
	
	document.getElementById("schedule").innerHTML = tableHeader + tableBody;
	//filter by routes;
	
	
	//iterate through each trip; find each timepoint. if no timepoint exists then 
	
	//create header by using stops by route
	//iterate through each trip, matching stop order. for stops that are not served show "-"
	
};

//function returns arrival of train to route
function getConnectionToFromRoute(time,route_id, stop_id, direction, service_id, tofrom){

	
	//get disaggregated trips from cleaned data.
	var connectingBusTime = moment(time,"h:mm");
	//handling for trips after midnight but before 3:00am
	if(connectingBusTime >= moment("0:00", "h:mm") && connectingBusTime < moment("3:00","h:mm")){
		connectingBusTime.add(1,"days");	
	}
	
	
	var lookupTripStops = revTripsData.filter(function(d){
		return d.route_id === route_id && d.direction_name  === direction && d.service_id === service_id && d.stop_id === stop_id;
	});

	
	//for each record, calculate time difference from desired connection time.
	lookupTripStops.forEach(function(d){
		var arrivalTime = moment(d.sch_arr_time_24h,"h:mm");
		
		//handling of 24 hours
		if(d.sch_arr_time_sort >= 2400){
			arrivalTime.add(1,"days");
		}
	
		//calculate difference
		d.diff = (connectingBusTime - arrivalTime)/60000;	
	});
	
	var linkConnection;
	//filter out diff less than 0 for "to route from Link" and more than 0 for "from route to Link"
	if(tofrom === "to"){
		lookupTripStops = lookupTripStops.filter(function(d){
			return d.diff > minConnect;
		});
		
		lookupTripStops = lookupTripStops.sort(function(a,b){
			if(a.diff > b.diff){
				return 1;	
			}
			else if(a.diff < b.diff){
				return -1;	
			}
			else {return 0;}
		});
		
		linkConnection = lookupTripStops[0].sch_arr_time_24h;
	}
	else if(tofrom === "from"){
		lookupTripStops = lookupTripStops.filter(function(d){
			return d.diff < (minConnect)*-1;
		});
		//sort descending
		lookupTripStops = lookupTripStops.sort(function(a,b){
			if(a.diff < b.diff){
				return 1;	
			}
			else if(a.diff > b.diff){
				return -1;	
			}
			else {return 0;}
		});
		
		
		//if there are two stop times (e.g. at terminals) within 1 minute, take the second of the two.
		
		if(lookupTripStops.length >= 2 && ((Math.abs(lookupTripStops[1].diff) - Math.abs(lookupTripStops[0].diff) >= 1)) && (Math.abs(lookupTripStops[1].diff) - Math.abs(lookupTripStops[0].diff) < 2)){
			linkConnection = lookupTripStops[1].sch_arr_time_24h;
		} 
		//if there are no trips, then show blank 
		else if(lookupTripStops.length === 0){
			linkConnection = null;
			
		} else {
			linkConnection = lookupTripStops[0].sch_arr_time_24h;
		}
		
		
		
	}
	
	/*//sort by smallest to greatest. 
	var lookupTripsSorted = lookupTripStops.sort(function(a,b){
			if(a.diff > b.diff){
				return 1;	
			}
			else if(a.diff < b.diff){
				return -1;	
			}
			else {return 0;} 
	}); */
	
	//return arrival time of Link train
	return linkConnection;
}



function getTripsByRoutes(routes, service_id, data){
	//gets unique trip ids by route sorted by first time point. 
	//route_id, trip_id, trip_start_time, trip_start_time_24h
	var trips = [];
	
	var routeData = [];
	if(!Array.isArray(data)){
		 routeData = data.filter(function(d){
			return d.route_id === routes;
		});
	}
	else if(Array.isArray(data)){
		routeData = data.filter(function(d){
			return routes.includes(d.route_id);
		});
	}
	
	//filter to service_id
	routeData = routeData.filter(function(d){
		return d.service_id === service_id;
	});
	
	//create array of all trips in stop time data. 
	for (var i = 0; i < routeData.length; i++){
		//check if trip already exists. 
		if(trips.filter(function(d){ 
			return d.trip_id === routeData[i].trip_id && d.route_id === routeData[i].route_id && d.service_id === routeData[i].service_id;}).length < 1){
			
			var obj = {}
			
			//if(routeData[i].route_id === 'S599'){
			//obj["trip_id"] = +routeData[i].trip_id;
			//} else {
			obj["trip_id"] = routeData[i].trip_id;	
			//}
			obj["route_id"] = routeData[i].route_id;
			obj["block_id"] = routeData[i].block_id;
			
			obj["service_id"] = routeData[i].service_id;
			obj["direction_name"] = routeData[i].direction_name;
			
			var stopTimes = getStopsByTrip(routeData[i].trip_id,routeData[i].service_id,routeData);
			
			obj["stops"] = stopTimes;
			
				
			obj["trip_start_time"] = obj["stops"][0]["sch_arr_time"];
			obj["trip_start_time_24h"] = obj["stops"][0]["sch_arr_time_24h"];
			
			var tripSortException = tripSortExceptions.filter(function(d){return routeData[i].route_id === d.route_id  &&  routeData[i].direction_name === d.direction_name;});
			var tripSort;		
			if (tripSortException.length > 0){
				//filter through stops to find time.
				var sortStop = stopTimes.filter(function(d){
					return d.stop_id === tripSortException[0].stop_id;
				});
				
				tripSort = sortStop[0].sch_arr_time_sort;
				
			}
			else{
				tripSort = +obj["trip_start_time"].replace(":","");
			}
			
			obj["trip_start_sort"] = tripSort; 
		
			trips.push(obj);
				
		}
	}
	
	
/*	//loop through each stop time, pulling out unique trips.
	for(var i = 0; i < routeData.length; i++){
		//if trip does not exist then add it to the list.
		if(trips.filter(function(d){return d.trip_id === routeData[i].trip_id;}).length < 1 && routeData[i].stop_seq < 2){
			var obj = {};
		
			obj["trip_id"] = routeData[i].trip_id;
			obj["route_id"] = routeData[i].route_id;
			obj["service_id"] = routeData[i].service_id;
			obj["direction_name"] = routeData[i].direction_name;
			obj["trip_start_time"] = routeData[i].sch_arr_time;
			obj["trip_start_time_24h"] = routeData[i].sch_arr_time_24h; 
			obj["trip_start_sort"] = +routeData[i].sch_arr_time.replace(":",""); //cheap workaround
			obj["stops"] = getStopsByTrip(routeData[i].trip_id,routeData[i].service_id,routeData);
		
			trips.push(obj);
			
		}
	
	}
	*/
	// if Link is included, remove all deadhead trips.
/*	trips = trips.filter(function(d){
		return (d.route_id !== 'S599' || (d.route_id === 'S599' && d.trip_id > 1000));
	});*/
	
	trips.sort(function(a,b){
		if(a.direction_name < b.direction_name){
			return -1;
		} else if(a.direction_name > b.direction_name){
			return 1;	
		} else{
		
		if(a.trip_start_sort > b.trip_start_sort){
				return 1;	
			}
			else if(a.trip_start_sort < b.trip_start_sort){
				return -1;	
			}
			else {return 0;} 
		}
	});
	
	return trips;
	//sort trips by start time. 	
}

//function gets all stops by trip_id
function getStopsByTrip(trip_id, service_id, data){
	var stopsByTrip = [];
	
	stopsByTrip = data.filter(function(d){
		return d.trip_id === trip_id && d.service_id === service_id;
	});

	stopsByTrip = stopsByTrip.sort(function(a,b){
		return a.stop_seq - b.stop_seq;
	});
	
	return stopsByTrip;
	
}

//finds list of direction names by route
function getDirectionNamesByRoute(routes, data){
	var routeData = [];
	var directions = new Array();
	
	if(!Array.isArray(routes)){
		 routeData = data.filter(function(d){
			return d.route_id === routes;
		});
	}
	else if(Array.isArray(routes)){
		routeData = data.filter(function(d){
			return routes.includes(d.route_id);
		});
	}
	
	
	//loop through finding unique direction names. 
	for(i = 0; i < routeData.length; i++){
		
		if(directions.filter(function(d){return d.direction_name === routeData[i].direction_name;}).length < 1){
			var obj ={};
			obj["route_id"] = routeData[i].direction_name;
			obj["direction_name"] = routeData[i].direction_name;
			directions.push(obj);
			
		}
		
	}
	return directions;
	
}

function loadDirectionMenu(){
	
	var selectedRoute  = document.getElementById("select-route");
	var valueRoute = selectedRoute.options[selectedRoute.selectedIndex].value;
	
	if(valueRoute.includes("-")){
		//push both routes into schedule.
		var routeArray = [];
		routeArray.push(valueRoute.substring(0, valueRoute.indexOf('-')));
		routeArray.push(valueRoute.substring(valueRoute.indexOf('-')+1,valueRoute.length));
		
		valueRoute = routeArray;
	}
	
	var directions = getDirectionNamesByRoute(valueRoute, revTripsData);
	
	//if there is no direction data in menu, then add note about missing schedules; exit
	if(directions.length === 0){
		document.getElementById("schedule").innerHTML = "No schedule data has been loaded for selected route during this service period.";
		
		return;
	}
	
	var directionMenu;
	
	directions.forEach(function(d){
		directionMenu += '<option value="' + d.direction_name + '">' + d.direction_name + '</option>';
		
	});
	
	document.getElementById("select-direction").innerHTML = directionMenu;
	 
	buildSchedules(); 	
	
}

// todo  creates CSV of all routes as separate files. names them 5XX_Weekday_ServiceChangeDate
function exportAllRoutes(){
}


//to do export CSV from table
// Quick and simple export target #table_id into a csv
function download_table_as_csv(table_id, separator) {
	var selectedRoute  = document.getElementById("select-route");
	var textRoute = selectedRoute.options[selectedRoute.selectedIndex].text;
	 
	
	
	var selectedDirection = document.getElementById("select-direction");
	var valueDirection = selectedDirection.options[selectedDirection.selectedIndex].value;
	
	var selectedServiceId = document.getElementById("select-service-id");
	var valueServiceId = selectedServiceId.options[selectedServiceId.selectedIndex].value;
	
    // Select rows from table_id
    var rows = document.querySelectorAll('table#' + table_id + ' tr');
    // Construct csv
    var csv = [];
    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll('td, th');
        for (var j = 0; j < cols.length; j++) {
            // Clean innertext to remove multiple spaces and jumpline (break csv)
            var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ')
            // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
            data = data.replace(/"/g, '""');
            // Push escaped string
            row.push('"' + data + '"');
        }
        csv.push(row.join(separator));
    }
    var csv_string = csv.join('\n');
    // Download it
    var filename = textRoute + '_' + valueDirection + '_'  + valueServiceId + '_' + table_id + '_' + new Date().toLocaleDateString() + '.csv';
    var link = document.createElement('a');
    link.style.display = 'none';
    link.setAttribute('target', '_blank');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
