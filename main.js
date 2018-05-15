var circles = null;
var radiuses = [100, 200, 300];
var lastCoordinates = null;
var schoolLayer;

function addMarkerWithRadius(latlon){
  if (latlon === undefined || latlon === null){
    return
  }
  //TODO: refactor this to remove global variables
  if (typeof(circles) !== "undefined"  && typeof(marker) !== "undefined"){
    map.removeLayer(circles);
    map.removeLayer(marker);
  }

  lastCoordinates = latlon;

  marker = L.marker(latlon, {draggable: true, icon: L.icon({iconUrl: "green-marker.png", iconSize: [25, 41],
      iconAnchor: [12.5, 41]})}).addTo(map);
  marker.on("dragend", function(e){
    X = e.target._latlng;
    latlon = new L.LatLng(X.lat, X.lng);
    addMarkerWithRadius(latlon);
    $(".leaflet-control-geocoder-form").children().first().val('');
    updatePrintHeader();
  });

  var colors = ['green', 'blue', 'red'];
  circles = L.featureGroup();
  radiuses = [$("#radius").val(), $("#radius2").val(), $("#radius3").val()]
  radiuses.forEach(function(radius, index){
    var circle = L.circle(latlon, {
      radius: radius,
      color: colors[index],
      fillColor: colors[index],
      fillOpacity: 0.0
    }).addTo(map);
    circle.addTo(circles);
    circle.bringToBack();
  });
  circles.addTo(map);
  map.flyToBounds(circles.getBounds());
}

var cloudmadeAttribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
var cloudmade = new L.TileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: cloudmadeAttribution
});

var map = new L.Map('map').addLayer(cloudmade).setView(new L.LatLng(52.52, 13.35), 11);

var berlinBounds = new L.LatLngBounds([52.3380737304688, 13.0883140563965], [52.6754760742188, 13.7609090805054]);
var osmGeocoder = new L.Control.OSMGeocoder(
  {collapsed: false,
    text:"Ort suchen",
    bounds: berlinBounds, 
    callback: function (results) {
      addMarkerWithRadius(new L.LatLng(results[0].lat, results[0].lon));
    }
  } 
);
map.addControl(osmGeocoder);

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var data = JSON.parse(this.response);
    L.geoJSON(data, {
      style:  {
        "color": "black",
        "weight": 2,
        "opacity": 0.65,
        "fillOpacity": 0
      }}).addTo(map);
  }
};
xhttp.open("GET", "berlin_bezirke.geojson", true);
xhttp.send();

var schoolsRequest = new XMLHttpRequest();
schoolsRequest.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var data = JSON.parse(this.response);
    schoolLayer = L.geoJSON(data, {onEachFeature: function(feature, layer){
      var popup = new L.popup({autoClose: false, closeOnClick: false});
      popup.setContent(feature.properties.name + "<br >" + feature.properties.address);
      layer.bindPopup(popup)
      }}).addTo(map);
    console.log(schoolLayer);
  }
};
schoolsRequest.open("GET", "geoschools-merged.json", true);
schoolsRequest.send();


function update_r(){
  addMarkerWithRadius(lastCoordinates);
  updatePrintHeader();
}

function set_print(){
  var m = $('#map');
  var mapWidth = $('#map').width();
  var mapHeight = $('#map').height();
  var ratio = mapWidth / mapHeight;
  var A4Width = '18cm';
  var A4Height = '20cm';
  var checked = $('#print_enabled').is(':checked');
  if (checked){
    if (ratio < 1){
      m.width(A4Width);
      m.height(A4Height);
    }
    else {
      m.width(A4Height);
      m.height(A4Width);
    }
  }
  else {
    m.width("100%");
    m.height("100%");
  }
  if (typeof(marker) !== "undefined"){
    L.Util.requestAnimFrame(map.invalidateSize,map,!1,map._container);
    map.panTo(marker._latlng);
  }
  $('#map').css('display', 'none').css('display', 'block');
  L.Util.requestAnimFrame(map.invalidateSize,map,!1,map._container);
  map.invalidateSize(false); // TODO check if this is still needed
}


function updatePrintHeader(){
  var searchInput = $(".leaflet-control-geocoder-form").children().first().val();
  var values = [$("#radius").val(), $("#radius2").val(),$("#radius3").val()].filter(function (v) { return !!v});
  $("#print-header").text(searchInput + '| Radius: ' +  values.join(" / ")+ ' Meter');
}

function emptyIt(){
  $("#radius").val("100");
  $("#print_enabled").attr("checked", false);
  $(".leaflet-control-geocoder-form").children().first().val("");
}


var radius_setter = $("<div class='leaflet-control-geocoder-form'>");
radius_setter.append("<input type='text' id=radius name='radius' value=" + radiuses[0] + " onKeyUp='update_r()'>");
radius_setter.append("<span> Meter Radius </span>"); // TODO align

radius_setter.append("<input type='text' id=radius2 name='radius' value=" + radiuses[1] + " onKeyUp='update_r()'>");
radius_setter.append("<span> Meter Radius </span>"); // TODO align

radius_setter.append("<input type='text' id=radius3 name='radius' value=" + radiuses[2] + " onKeyUp='update_r()'>");
radius_setter.append("<span> Meter Radius </span>"); // TODO align

var print_enabler = $("<div class='leaflet-control-geocoder-form'>");
print_enabler.append("<input type='checkbox' id='print_enabled'>");
print_enabler.append("<label for='print_enabled'> Auf Druckgröße verkleinern </label>");

var showSchools = $("<div class='leaflet-control-geocoder-form'>");
showSchools.append("<input type='checkbox' checked id='show_schools'>");
showSchools.append("<label for='show_schools'>Schulen anzeigen</label>");

$(".leaflet-control-geocoder").append(radius_setter);
$(".leaflet-control-geocoder").append(print_enabler);
$(".leaflet-control-geocoder").append(showSchools);

$("#print_enabled").click(set_print);

function toggleSchoolLayer() {
  if (map.hasLayer(schoolLayer)){
    map.removeLayer(schoolLayer);
  } else {
    map.addLayer(schoolLayer);
  }
}

$("#show_schools").click(toggleSchoolLayer);

$(".leaflet-control-geocoder-form").children().first().change(function() { updatePrintHeader();});

updatePrintHeader();
window.setTimeout(function(){emptyIt();}, 400);
