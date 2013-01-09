dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.map");
dojo.require("esri.tasks.query");
dojo.require("esri.dijit.InfoWindowLite");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.layout.AccordionContainer");

var map;
var clickTask, click, cksymbol, info2;

function init() {


    var initialExtent = new esri.geometry.Extent({ "xmin": -117.0049, "ymin": 32.768044, "xmax": -116.896, "ymax": 32.828, "spatialReference": { "wkid": 4326} });

    map = new esri.Map("map", { extent: esri.geometry.geographicToWebMercator(initialExtent) });

    var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
    map.addLayer(basemap);


    var resizeTimer;

    dojo.connect(map, 'onLoad', function (theMap) {
        dojo.connect(dijit.byId('map'), 'resize', function () {  //resize the map if the div is resized
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                map.resize();
                map.reposition();
            }, 500);
        });
    });
    http: //help.arcgis.com/en/webapi/javascript/arcgis/help/jshelp/whats_new.html
    runQuery();
}

function runQuery() {

    var queryTask = new esri.tasks.QueryTask("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/ELCAJON/javascriptMap/MapServer/0");

    var query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.where = '1=1';
    query.outFields = ["*"];

    dojo.connect(queryTask, "onComplete", function (featureSet) {

        var cL = new esri.ux.layers.ClusterLayer({
            displayOnPan: false,
            map: map,
            features: featureSet.features,
            infoWindow: {
                template: new esri.InfoTemplate('${FacilityID}', '<b>ServiceID:</b> ${FacilityID}'),
                width: 225,
                height: 85
            },
            flareLimit: 15,
            flareDistanceFromCenter: 20
        });

        map.addLayer(cL);

    });

    dojo.connect(queryTask, "onError", function (err) {
        alert(err.details);
    });

    queryTask.execute(query);

  

}




dojo.addOnLoad(init);