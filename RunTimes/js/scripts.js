// JavaScript Document

//Global variables
var agencyId; //'sound-pierce';
var routeId; // = '577';
var directionId; // = '1';
var apiKey; // = '';

var startDateString; // = '03-19-2022';
var endDateString; // = '04-19-2022';
var daysOfWeek; // = '1,2,3,4,5';

var CTRoutes = ['510','511','512','513','532','535'];
var KCMRoutes = ['522','542','545','550','554','556','566'];
var PTRoutes = ['560','574','577','578','580','586','590','592','594','596'];


var apiEndPoint = '';


var tripLevelDataCleaned = [];
var tripStopData = [];

var apiLimit = 160;
/*

const settings = {
  "async": true,
  "crossDomain": true,
  "url": "https://api.goswift.ly/run-times/sound-pierce/route/580/by-trip?startDate=03-19-2022&endDate=04-19-2022&daysOfWeek=1%2C2%2C3%2C4%2C5",
  "method": "GET",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "943bda9de314ff3e5408aa825f39cea1"
  }
};

$.ajax(settings).done(function (response) {
  console.log(response);
});
*/



//gets all user inputs and validates them.
function getUserInputs(){
	//get route
	var selectedRouteId  = document.getElementById("select-route");
	routeId = selectedRouteId.options[selectedRouteId.selectedIndex].value;
	
	//get agencyId from route number.
	if(PTRoutes.includes(routeId)){
		agencyId = "sound-pierce";	
	}
	else if(CTRoutes.includes(routeId)){
		agencyId = "community-transit";
	}
	else if(KCMRoutes.includes(routeId)){
		agencyId = "sound-king-county";
	}
	
	//get direction
	var selectedDirectionId  = document.getElementById("select-direction");
	directionId = parseInt(selectedDirectionId.options[selectedDirectionId.selectedIndex].value);
	
	//get  start date
	var selectedStartDate = document.getElementById("datestart");
	startDateString = selectedStartDate.value;
	
	
	//get end date
	var selectedEndDate = document.getElementById("dateend");
	endDateString = selectedEndDate.value;
	
	
	// get  days of week
	var selectedDaysOfWeek = document.getElementById("daysofweek");
	daysOfWeek = (selectedDaysOfWeek.value).replaceAll(',','%2C');
	
	//get API key
	var userAPIKey = document.getElementById("swiftlyapikey");
	apiKey = userAPIKey.value;	

	//clear data annd then load
	 tripLevelDataCleaned = [];
	 tripStopData = [];
	
	//loaddata
	loadData();
}



//loadData();

//call swiftly
function loadData(){
	document.getElementById("status").innerHTML = "Loading...";
	
	var tripData = {};
	
	var apiURL = "https://api.goswift.ly/run-times/" + agencyId + "/route/" + routeId + "/by-trip?startDate=" + startDateString + "&endDate=" + endDateString + "&daysOfWeek=" + daysOfWeek;
	
console.log(apiURL);

	
	var settingsTripLevel = {
		"async": true,
		"crossDomain": true,
		"url": apiURL,
		"method": "GET",
		"headers": {
			"Content-Type": "application/json",
			"Authorization": apiKey
		}
	};
	
	console.log(settingsTripLevel);
	
	$.ajax(settingsTripLevel).done(function (response) {
		console.log(response);
	  console.log(JSON.stringify(response));
		tripData = response.data;	
		//console.log(tripData);
		cleanData(tripData);
	});

}


//clean data
function cleanData(data){
	//convert time to human readable time using moment 
	
	data["direction-0"].forEach(function(d){
		//handling for below 24 hours:
		if(d.scheduledDepartureSeconds >= 86400){
			d.scheduledDeparture = moment.utc((d.scheduledDepartureSeconds-86400)*1000).format('HH:mm:ss'); 
			
		} else {
			d.scheduledDeparture = moment.utc((d.scheduledDepartureSeconds)*1000).format('HH:mm:ss');	
		}
		d.directionId = 0;
		
	});
	
	data["direction-1"].forEach(function(d){
		//handling for below 24 hours:
		if(d.scheduledDepartureSeconds >= 86400){
			d.scheduledDeparture = moment.utc((d.scheduledDepartureSeconds-86400)*1000).format('HH:mm:ss'); 
			
		} else {
			d.scheduledDeparture = moment.utc((d.scheduledDepartureSeconds)*1000).format('HH:mm:ss');	
		}
		
		d.directionId = 1;
	});
	
	//collapse the direction field; append both direrctions into different arrays. 
	
	var combinedDirectionsData = [];
	data["direction-0"].forEach(function(d){
		combinedDirectionsData.push(d);
		
	});

	data["direction-1"].forEach(function(d){
		combinedDirectionsData.push(d);
		
	});
	
	//add data 
	tripLevelDataCleaned = combinedDirectionsData;
	
	console.log(tripLevelDataCleaned);
	
	/////call getStopLevelData
	getStopLevelDataByTrip(tripLevelDataCleaned, directionId);
	
	
}



function getStopLevelDataByTrip(data, dirId){
	var filteredData = data.filter(function(d){
		return d.directionId === dirId;
	});
	
	
	console.log(filteredData);
	
	
	var stopsByTripData;
	
	var loop = 0;
	var loopLast = filteredData.length;
	
	loadStopData(filteredData[loop].tripId);
	
	
	function loadStopData(tripId){
		var stopData;
		
		var settingsStopLevel = {
			"async": true,
			"crossDomain": true,
			"url": "https://api.goswift.ly/run-times/" + agencyId + "/route/" + routeId + "/trip/" + tripId + "/by-stop?startDate=" + startDateString + "&daysOfWeek=" + daysOfWeek + "&endDate=" + endDateString,
			"method": "GET",
				"headers": {
				"Content-Type": "application/json",
				"Authorization": "943bda9de314ff3e5408aa825f39cea1"
				}
		};
		
		//update trip status
		document.getElementById("status").innerHTML = 'Loading ' + (loop + 1) + ' of ' + loopLast + ' trips...';
		
		$.ajax(settingsStopLevel).done(function (response) {
			  console.log(response);
				stopData = response.data;

				stopDataCleaned = cleanStopData(stopData);

				console.log(stopDataCleaned);

			//clean data	

			//append to array of stop data.
			tripStopData.push(stopDataCleaned);

			//get trip start time from data;

			loop++;

			if(loop < loopLast){
			//move to next trip	
				loadStopData(filteredData[loop].tripId);
			}
			else{
				//last time through
				console.log("Looping complete: trips all loaded");
				//sort by stop time. 
				tripStopData.sort(function(a,b){
					
					return a.scheduledDepartureSeconds - b.scheduledDepartureSeconds;
				});
				
				console.log(tripStopData);

				
				createRuntimesByStopTableAggregated(tripStopData);

			}
		
		});
	
	}

}

//cleans a single trip's stop data, adds quantiles, segments

function cleanStopData(data){
	//aggregate stats and loop through
	for(var i = 0; i < data.byStopRuntimeData.length; i++){
		
		data.byStopRuntimeData[i].runTimeAverage = d3.mean(data.byStopRuntimeData[i].observedRuntimes, e => e.runTime);
		
		data.byStopRuntimeData[i].runTimeMedian = d3.median(data.byStopRuntimeData[i].observedRuntimes, e => e.runTime);
		
		data.byStopRuntimeData[i].runTime85th = d3.quantile(data.byStopRuntimeData[i].observedRuntimes, 0.85, e => e.runTime);
		
		data.byStopRuntimeData[i].dwellTimeAverage = d3.mean(data.byStopRuntimeData[i].observedRuntimes, e => e.dwellTime);
		data.byStopRuntimeData[i].dwellTimeMedian = d3.median(data.byStopRuntimeData[i].observedRuntimes, e => e.dwellTime);
		data.byStopRuntimeData[i].dwellTime85th = d3.quantile(data.byStopRuntimeData[i].observedRuntimes, 0.85, e => e.dwellTime);
		
		
		data.byStopRuntimeData[i].travelTimeAverage = d3.mean(data.byStopRuntimeData[i].observedRuntimes, e => e.travelTime);
		data.byStopRuntimeData[i].travelTimeMedian = d3.median(data.byStopRuntimeData[i].observedRuntimes, e => e.travelTime);
		data.byStopRuntimeData[i].travelTime85th = d3.quantile(data.byStopRuntimeData[i].observedRuntimes, 0.85, e => e.travelTime);
		
		//sample size
		data.byStopRuntimeData[i].sampleSize = data.byStopRuntimeData[i].observedRuntimes.length;
		
		
		if(i > 0){
			data.byStopRuntimeData[i].prevStop = data.byStopRuntimeData[i-1].stopName;
			data.byStopRuntimeData[i].segmentName = data.byStopRuntimeData[i].prevStop + " to " + data.byStopRuntimeData[i].stopName;
		} else{
			data.byStopRuntimeData[i].prevStop = null;
			data.byStopRuntimeData[i].segmentName = null;
		}
		
	}
	
	//find trip start time direction, route.
	var tripDetails;
	
	tripDetails = tripLevelDataCleaned.filter(function(d){
		return d.tripId === data.tripId;
	});
	
	data.scheduledDeparture = tripDetails[0].scheduledDeparture;
	data.directionId = tripDetails[0].directionId;
	data.scheduledDepartureSeconds = tripDetails[0].scheduledDepartureSeconds;
	
	//get median sample size by stop
	data.medianSampleSize = d3.median(data.byStopRuntimeData, e => e.sampleSize);
	
	
	return data;
}


//creates table of aggregated data
function createRuntimesByStopTableAggregated(data){
	// get selected metric: median, average, 85th
	var selection = '85th';
	//create header
	var tableHeader;
	var tableHeader = "<thead><tr>";

	var showTravelAndDwell = false;
	var showScheduled = false;
	
	// check if checkbox to break out dwell/travel is checked.
	
	var checkBoxDwellTravel = document.getElementById("showTravelandDwell");
	if(checkBoxDwellTravel.checked === true){
		showTravelAndDwell = true;
		
	}
	else{
		showTravelAndDwell = false;
	}
	
	var checkboxScheduled = document.getElementById("showScheduledRunTimes");
	if(checkboxScheduled.checked === true){
		showScheduled = true;
	}
	
	
	// route, direction, trip, trip start time, stop segments
	tableHeader += '<th scope="col">' + 'Direction' + '</th>' ;
	tableHeader += '<th scope="col">' + 'Trip' + '</th>' ;
	tableHeader += '<th scope="col">' + 'Trip Start Time' + '</th>' ;
	tableHeader += '<th scope="col">' + 'Median sample size' + '</th>' ;
	
	if(showScheduled === true){
		tableHeader += '<th scope="col">' + 'Scheduled or Operated' + '</th>' ;
		
	}
	
	var segmentData = getSegmentsByTrip(tripStopData);
	
	console.log(segmentData);
	//display all segments
	segmentData.forEach(function(d){
		if(showTravelAndDwell === true){
			tableHeader += '<th scope="col">' + d.segmentName + ' - Travel</th>';
			tableHeader += '<th scope="col">' + d.stopName + ' - Dwell</th>';
			tableHeader += '<th scope="col">' + d.segmentName + ' - Total</th>';
			
		} else{
		
		//segment name
		tableHeader += '<th scope="col">' + d.segmentName + '</th>'; 
		
		}
	});
	
	
	
	tableHeader += "</tr></thead>";
	
	
	
	//create table body
	
	var tableRows;
	tableRows = '<tbody>';

	//iterate through data all rows 
	
	for (var i = 0; i < data.length; i++){
		//1. TRIP INFO direction and trip and trip start time
		tableRows += '<tr>';
		tableRows +='<td>' + data[i].directionId + '</td>'+'<td>' + data[i].tripId +'</td>'+'<td>' + data[i].scheduledDeparture + '</td>';
		
		tableRows+= '<td>' + data[i].medianSampleSize + '</td>';
		
		if(showScheduled){
			tableRows += '<td>Operated</td>';
		}
		
		//2. SEGMENT INFO: then find for each segment the matching run time stat
		//loop through each stop, and find the observed run time for that segment.
		segmentData.forEach(function(d){
			if(d.segmentName){
				var runTime;
				//for each segment, find the corresponding metric
				runTime = (data[i].byStopRuntimeData).filter(function(e){
					return d.segmentName === e.segmentName;

				});
				
				
				//if breaking out travel times and dwell times, then: 
				if(showTravelAndDwell === true){
					if(runTime.length > 0){
						// run time datum.

						tableRows+= '<td>';
						tableRows+= (runTime[0].travelTime85th/60).toFixed(2);
						tableRows += '</td>';	

						tableRows+= '<td>';
						tableRows+= (runTime[0].dwellTime85th/60).toFixed(2);
						tableRows += '</td>';	

						tableRows+= '<td>';
						tableRows+= (runTime[0].runTime85th/60).toFixed(2);
						tableRows += '</td>';
					} else{
						tableRows+= '<td>';
						tableRows+= ''
						tableRows += '</td>';

						tableRows+= '<td>';
						tableRows+= ''
						tableRows += '</td>';

						tableRows+= '<td>';
						tableRows+= ''
						tableRows += '</td>';
					}
				} else {	
					//just run times
					if(runTime.length > 0){
						// run time datum.
						tableRows+= '<td>';
						tableRows+= (runTime[0].runTime85th/60).toFixed(2);

						tableRows += '</td>';
					} else{
						tableRows+= '<td>';
						tableRows+= ''

						tableRows += '</td>';

					}
				}
			
			}
			
		});	
		
		//finish row
		tableRows += '</tr>';
		
		//add scheduled data if selectede.
		if(showScheduled === true){
			//add new row for showing schedule. 
			
			tableRows += '<tr>';
			tableRows +='<td>' + data[i].directionId + '</td>'+'<td>' + data[i].tripId +'</td>'+'<td>' + data[i].scheduledDeparture + '</td>';

			tableRows+= '<td>' + data[i].medianSampleSize + '</td>';

			if(showScheduled){
				tableRows += '<td>Scheduled</td>';
			}

			segmentData.forEach(function(d){
			if(d.segmentName){
				var runTime;
				//for each segment, find the corresponding metric
				runTime = (data[i].byStopRuntimeData).filter(function(e){
					return d.segmentName === e.segmentName;

				});
				
				
				//if breaking out travel times and dwell times, then: 
				if(showTravelAndDwell === true){
					if(runTime.length > 0){
						// run time datum.

						tableRows+= '<td>';
						//tableRows+= (runTime[0].travelTime85th/60).toFixed(2);
						tableRows += '</td>';	

						tableRows+= '<td>';
						//tableRows+= (runTime[0].dwellTime85th/60).toFixed(2);
						tableRows += '</td>';	

						tableRows+= '<td>';
						tableRows+= (runTime[0].scheduledRuntime/60).toFixed(2);
						tableRows += '</td>';
					} else{
						tableRows+= '<td>';
						tableRows+= ''
						tableRows += '</td>';

						tableRows+= '<td>';
						tableRows+= ''
						tableRows += '</td>';

						tableRows+= '<td>';
						tableRows+= ''
						tableRows += '</td>';
					}
				} else {	
					//just run times
					if(runTime.length > 0){
						// run time datum.
						tableRows+= '<td>';
						tableRows+= (runTime[0].scheduledRuntime/60).toFixed(2);

						tableRows += '</td>';
					} else{
						tableRows+= '<td>';
						tableRows+= ''

						tableRows += '</td>';

					}
				}
			
			}
			
		});	
				
				
				
				
			
			
		}
		
		
	}	
	//end
	tableRows+= '</tbody>';
	
	//
	document.getElementById("status").innerHTML = "";
	//replace div class table with new dat
	document.getElementById("datatable").innerHTML = tableHeader + tableRows;
	
}


//displays table of all data points for download.
function createRuntimesByStopTableRaw(){
	
	
}

//creates a stop list of all stops including branches/variants. Uses all trip/stop data
function getSegmentsByTrip(data){
	//looks for segments in stop level data, creates a list of segments.
	var segments = [];
	
	//loop through data getting segment info.
	for (var i = 0; i < data.length; i++){
		for(var j = 0; j < data[i].byStopRuntimeData.length; j++){
			//does the segment exist already? 
			//if segment exists in the segments array. 

			if(segments.filter(function(d){
				return d.segmentName === data[i].byStopRuntimeData[j].segmentName;
			}).length < 1){
				var obj = {};
				
				obj["segmentName"] = data[i].byStopRuntimeData[j].segmentName;
				obj["maxStopOrder"] = data[i].byStopRuntimeData[j].stopOrder;
				obj["stopName"] = data[i].byStopRuntimeData[j].stopName;
				segments.push(obj);
				
			} else {
				// if it already exists, then update max stop.
				//loop through to find max stop sequence. update
				for (var k = 0; k < segments.length; k++){
					if(segments[k].segmentName === data[i].byStopRuntimeData[j].segmentName && segments[k].maxStopORder < data[i].byStopRuntimeData[j].maxStopOrder){
						//update
						segments[k].maxStopOrder = data[i].byStopRuntimeData[j].maxStopOrder;
						
					}
					
				}
	
			}
			
		}
	
	}
	
	//sort segments by max stop order.
	
	segments.sort(function(a,b){
		return a.maxStopOrder - b.maxStopOrder;
	});
	
	//remove first stop of trip
	var segmentsCleaned = segments.filter(function(d){
		return d.segmentName !== null;
		
	})
	
	console.log(segmentsCleaned);
	return segmentsCleaned;
	
	
}



function download_table_as_csv(table_id, separator) {

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
    var filename = 'Runtimes_' + routeId + '_' + directionId + '_' + startDateString + '_' + endDateString + '_' + daysOfWeek + '.csv';
    var link = document.createElement('a');
    link.style.display = 'none';
    link.setAttribute('target', '_blank');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

