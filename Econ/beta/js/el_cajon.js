
dojo.require("dijit.dijit");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.layout.AccordionContainer");
dojo.require("esri.map");
dojo.require("esri.arcgis.utils");
dojo.require("esri.tasks.query");
dojo.require("dijit.form.TextBox");
dojo.require("esri.dijit.InfoWindowLite");
dojo.require("esri.virtualearth.VETiledLayer");
dojo.require("dijit.TitlePane");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.arcgis.utils");


var map, queryTask, query;

function init() {

    //set up map
    var initialExtent = new esri.geometry.Extent({ "xmin": -117.0049, "ymin": 32.768044, "xmax": -116.896, "ymax": 32.828, "spatialReference": { "wkid": 4326} });
    map = new esri.Map("map", { extent: esri.geometry.geographicToWebMercator(initialExtent) });

    //Add the basemap
    var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
    map.addLayer(basemap);


    //add the Wastewater locations
    var wwl = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/ELCAJON/html_5/MapServer/0", {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });
    map.addLayer(wwl);

    createBasemapGallery();


    //resize the map when the browser resizes
    dojo.connect(map, 'onLoad', function (theMap) {
        dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
    });

    function createBasemapGallery() {
        //add the basemap gallery, in this case we'll display maps from ArcGIS.com including bing maps
        var basemapGallery = new esri.dijit.BasemapGallery({
            showArcGISBasemaps: true,
            bingMapsKey: 'Enter your Bing Maps Key',
            map: map
        }, "basemapGallery");

        basemapGallery.startup();

        dojo.connect(basemapGallery, "onError", function (msg) { console.log(msg) });
    }


    //new query task for finding stuff
    queryTask = new esri.tasks.QueryTask("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/ELCAJON/html_5/MapServer/0");


    //build query filter
    query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.text = "where 1 = 1";
    query.outSpatialReference = map.spatialReference;
    query.outFields = ["*"];


}


//build query with inputs
    function executeQuery() 
        {
            var inputs = document.getElementById('Tinput')
            var input = inputs.value;
            //alert(input);

            query.where = "FacilityID = '" + input + "'";
            //execute query
            queryTask.execute(query, showResults);
            
        }


        //show results on the map
        function showResults(results) {

           
            map.graphics.clear();
            var items = [];
            var symbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color([255, 0, 0,.55]));

            for (var i = 0, il = results.features.length; i < il; i++) {
                items.push(results.features[i].attributes);
                
                    var graphic = results.features[i];
                    graphic.setSymbol(symbol);
                    map.graphics.add(graphic);
                    graphicAttributes = graphic.attributes;
           
            }


                var serviceExtent = graphic.geometry;
                map.setLevel(18);
                map.centerAt(serviceExtent);
                
                var infoTemplate = new esri.InfoTemplate();

                infoTemplate.setTitle("<b>Service ID: ${GEODB_Fathom_ElCajon.SDE.WasteWaterServiceLocation.FacilityID}</b>");
                infoTemplate.setContent("<b>${consumption}</b>");
                graphic.setInfoTemplate(infoTemplate);
                map.infoWindow.resize(245, 105);
                map.infoWindow.setTitle(graphic.getTitle());
                map.infoWindow.setContent(graphic.getContent());
                map.infoWindow.show(serviceExtent);
                                     
        }

  
        dojo.addOnLoad(init);
