var API_KEY = "AIzaSyDdRkxa8xEcg8GKWrpHMnv4tU0OYuC8kls"
var map;
var oms;
var count = 0;


function makeMap(position) {
    var lat = parseFloat(position.coords.latitude);
    var lon = parseFloat(position.coords.longitude);
    var loc = new google.maps.LatLng(lat, lon);

    var opts = {
        zoom: getZoom() - 4,
        center: loc,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById("map_canvas"), opts);
    oms = new OverlappingMarkerSpiderfier(map, {markersWontMove: true, markersWontHide: true});
    var info = new google.maps.InfoWindow();
    oms.addListener('click', function(marker) {
	console.log('Click');
	info.setContent(marker.desc);
	info.open(map, marker);
    });
    var marker = new google.maps.Marker({
        map: map,
        position: loc,
        icon: getCenterpin(),
        title: 'Current Location',
    });

    google.maps.event.addListener(map, 'idle', lookupDocs);
}

function lookupDocs() {
    $.ajax({
        type: "GET",
        url: "http://api.dp.la/v2/items?api_key=9c3ed1019b32c21cbfb3a70394cb8980&dataProvider=%22National%20Museum%20of%20American%20History%22&sourceResource=%22image%22&fields=sourceResource.title,sourceResource.date.displayDate,sourceResource.spatial.coordinates,sourceResource.description&page_size=500&callback=myFunc",
        contentType: "application/json",
        dataType: "jsonp",
        data: JSON.stringify({
            sourceResource.description: $("#description").val(),
            sourceResource.title: $("#title").val(),
            sourceResource.date.displayDate: $("#date").val(),
            sourceResource.spatial.coordinates: $("#spatial.coordinates").val(),
        }),
        success: function(response) {
            console.log(response);
        },
        error: function(response) {
            console.log(response);
        }
});
    
function clearMarkers() {
    var markers = oms.getMarkers();
    for (var i=0; i < markers.length; i++) {
	markers[i].setMap(null);
    }
    oms.clearMarkers();
}

function displayDocs(data) {
    count = 0;
    clearMarkers();
    $.each(data.docs, displayDoc);
    console.log('Points mapped: ' + count);
}

function displayDoc(index, doc) {
    count += 1;
    var loc;
    $(doc.sourceResource.spatial).each(function(i,coord) {
	var coords = coord.coordinates;
        // TODO: We use the first set of coords we find, but it may not be the best
        if (coords && !loc) {
            coords = coords.split(",");
            var lat = parseFloat(coords[0]);
            var lon = parseFloat(coords[1]);
            loc = new google.maps.LatLng(lat, lon);
	 }
    });

    // create a marker for the subject
    if (loc) {
	    
	    var title = source.title;
	    var description = '';
	    if ('description' in source) {
                 description = source.description;
            }
	    var date = '';
	    if ('date' in source) {
                date = ' (' + source.date.displayDate + ') ';
            }
            var provider = doc.provider.name;
	    var providerId = doc.provider['@id'];

            var icon = getPushpin();

            // TODO: Choose marker based on type of resource
            var marker = new google.maps.Marker({
                map: map,
                icon: icon,
                position: loc,
		title: title + ' -- ' + provider + date
            });

            // add a info window to the marker so that it displays when
            // someone clicks on the marker
            var item = '<a target="_new" href="' + recordUrl + '">' + title + '</a>' + date;
            provider = '<a target="_new" href="' + viewUrl + '">' + provider + '</a>.';
            var html = '<span class="map_info">' + item +' from ' + provider + ' '+description+'</span>';
	    marker.desc = html;
	    oms.addMarker(marker);
        }
}

function displayError() {
    html = "<p class='error'>Your browser doesn't seem to support the HTML5 geolocation API. You will need either: Firefox (3.5+), Safari (5.0+) Chrome (5.0+), Opera (10.6+), iPhone (3.0+) or Android (2.0+). Sorry!</p>";
    $("#subject_list").replaceWith(html);
}

function getPushpin() {
    return getPin("http://maps.google.com/mapfiles/kml/pushpin/red-pushpin.png");
}

function getCenterpin() {
    return getPin("http://maps.google.com/mapfiles/kml/pushpin/blue-pushpin.png");
}

function getPin(url) {
    size = 30;
    return new google.maps.MarkerImage(url, new google.maps.Size(64, 64), new google.maps.Point(0, 0), new google.maps.Point(0, size), new google.maps.Size(size, size));
}

function getZoom() {
    if (is_handheld()) {
        return 15;
    } else {
        return 12;
    }
}
