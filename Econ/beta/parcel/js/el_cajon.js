
dojo.require("dijit.dijit");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.layout.AccordionContainer");
dojo.require("dijit.TitlePane");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.Toolbar");
dojo.require("esri.map");
dojo.require("esri.tasks.query");
dojo.require("esri.dijit.InfoWindowLite");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.arcgis.utils");
dojo.require("esri.toolbars.navigation");
dojo.require("esri.virtualearth.VETiledLayer");



var map, queryTask, query, navToolbar;

//new vars
var clickTask, click, cksymbol, info2;

function init() {

    //set up map
    esri.config.defaults.map.sliderLabel = null;
    var initialExtent = new esri.geometry.Extent({ "xmin": -117.0049, "ymin": 32.768044, "xmax": -116.896, "ymax": 32.828, "spatialReference": { "wkid": 4326} });
    map = new esri.Map("map", { extent: esri.geometry.geographicToWebMercator(initialExtent) });

    //Add the basemap
    var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
    map.addLayer(basemap);


    //add the Wastewater locations
    var wwl = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/ELCAJON/javascriptMap/MapServer/0", {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });



    // add the parcel wms layer 

    var parcels = new esri.layers.WMSLayerInfo({ name: "0", title: "Parcels" });

    var resourceInfo = {
        extent: new esri.geometry.Extent(-117.0049, 32.768044, -116.896, 32.828, { wkid: 4326 }),
        layerInfos: [parcels]
    };


    var par = new esri.layers.WMSLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/services/ELCAJON/javascriptMap/MapServer/WMSServer",
          { resourceInfo: resourceInfo,
              visibleLayers: ["0"]
          }
        );


       
       dojo.connect(map, "onExtentChange", function () { map.removeLayer(par); });
       dojo.connect(map, "onExtentChange", function () {

                  var level = map.getLevel();
                  // alert(level);
                  if (level > 15) {
                      map.addLayer(par);
                  }
                  if (map.getLevel() < 16) {
                      map.removeLayer(par);
                  }


              });




          map.addLayer(par);     
          map.addLayer(wwl);
          
 

    createBasemapGallery();

    navToolbar = new esri.toolbars.Navigation(map);
    dojo.connect(navToolbar, "onExtentHistoryChange", extentHistoryChangeHandler);


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
    queryTask = new esri.tasks.QueryTask("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/ELCAJON/javascriptMap/MapServer/0");

    

    //build query filter
    query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.text = "where 1 = 1";
    query.outSpatialReference = map.spatialReference;
    query.outFields = ["*"];



    //set up map click stuff
    dojo.connect(map, "onClick", executeClickTask);
    clickTask = new esri.tasks.QueryTask("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/ELCAJON/javascriptMap/MapServer/1");
    click = new esri.tasks.Query();
    click.returnGeometry = true;
    click.outSpatialReference = map.spatialReference;
    click.outFields = ["*"];

    //info window for tax parcel
    info2 = new esri.InfoTemplate();
    //symbol for map click 
    cksymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 255, 0, 0.5]));
 

}

//map click query  

function executeClickTask(evt) {
    //onClick event returns the evt point where the user clicked on the map.
    //This is contains the mapPoint (esri.geometry.point) and the screenPoint (pixel xy where the user clicked).
    //set query geometry = to evt.mapPoint Geometry
    click.geometry = evt.mapPoint;

    //Execute task and call showResults on completion
    clickTask.execute(click, ckResults);
}


//show results of click 
function ckResults(featureSet) {
 
    map.graphics.clear();

    dojo.forEach(featureSet.features, function (feature) {
        var ckgraphic = feature;
        ckgraphic.setSymbol(cksymbol);

        //Set the infoTemplate.
        ckgraphic.setInfoTemplate(info2);
        info2.setContent("<strong>APN: </strong>${APN}");

        //Add graphic to the map graphics layer.
        map.graphics.add(ckgraphic);

        //open and place info window
        var txExtent = ckgraphic.geometry;
        ckpt = txExtent.getExtent();
        ctr = ckpt.getCenter();

        map.infoWindow.resize(245, 105);
        map.infoWindow.setTitle('<strong>Tax Lot Information</strong>');
        map.infoWindow.setContent(ckgraphic.getContent());
        map.infoWindow.show(ctr);
    });
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

                infoTemplate.setTitle("<b>Service ID: ${FacilityID}</b>");
                infoTemplate.setContent("<b>${FacilityID}</b>");
                graphic.setInfoTemplate(infoTemplate);
                map.infoWindow.resize(245, 105);
                map.infoWindow.setTitle(graphic.getTitle());
                map.infoWindow.setContent(graphic.getContent());
                map.infoWindow.show(serviceExtent);
                           
        }




        function extentHistoryChangeHandler() {
            dijit.byId("zoomprev").disabled = navToolbar.isFirstExtent();
            dijit.byId("zoomnext").disabled = navToolbar.isLastExtent();
        }


        function chart() {
            alert('hi');
        }


       

        function tax() {
            alert('Click on a tax lot to get its information.');

        }

        dojo.addOnLoad(init);
