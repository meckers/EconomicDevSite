
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.layout.AccordionContainer");
dojo.require("esri.map");
dojo.require("esri.arcgis.utils");
dojo.require("dijit.form.CheckBox");
dojo.require("esri.tasks.query");
dojo.require("dijit.form.TextBox");
dojo.require("esri.dijit.InfoWindowLite");

var map;
var legendLayers = [];
var queryTask, query, queryTask2, query2, queryTask3, query3;
var grid, store;


function init() {

    

    //set up map
    var initialExtent = new esri.geometry.Extent({ "xmin": -117.0049, "ymin": 32.768044, "xmax": -116.896, "ymax": 32.828, "spatialReference": { "wkid": 4326} });
    map = new esri.Map("map", { extent: esri.geometry.geographicToWebMercator(initialExtent) });

    //Add the terrain service to the map. View the ArcGIS Online site for services http://arcgisonline/home/search.html?t=content&f=typekeywords:service    
    var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
    map.addLayer(basemap);



    var wwl = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/ELCAJON/WasteWaterServices/MapServer/0", {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });


    var parcels = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/ELCAJON/html_5/MapServer/1", {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

  
    map.addLayers([parcels, wwl]);

    //dojo.connect(map, "onClick", clear);
    dojo.connect(map, "onClick", executeQueryTask);

    dojo.connect(map, 'onLoad', function (theMap) {
        //resize the map when the browser resizes
        dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
    });



    //new query task for finding stuff
    queryTask = new esri.tasks.QueryTask("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/ELCAJON/html_5/MapServer/0");


    //build query filter
    query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.outSpatialReference = map.spatialReference;
    query.outFields = ["*"];



    queryTask2 = new esri.tasks.QueryTask("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/ELCAJON/WasteWaterServices/MapServer/0");

    //build query filter
    query2 = new esri.tasks.Query();
    query2.returnGeometry = true;
    query.text = "where 1 = 1";
    query2.outSpatialReference = map.spatialReference;
    query2.outFields = ["FacilityID"];


    queryTask3 = new esri.tasks.QueryTask("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/ELCAJON/html_5/MapServer/1");

    //build query filter
    query3 = new esri.tasks.Query();
    query3.returnGeometry = true;
    query.text = "where 1 = 1";
    query3.outSpatialReference = map.spatialReference;
    query3.outFields = ["APN"];



}


    function executeQuery() 
        {
            var inputs = document.getElementById('Tinput')
            var input = inputs.value;
            //alert(input);

            query.where = "FacilityID = '" + input + "'";
            //execute query
            queryTask.execute(query, showResults);
            
        }


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
                   // cbx = graphicAttributes.Address;
                   // alert(cbx);
           
            }


                var taxLotExtent = graphic.geometry;
                map.setLevel(19);
                map.centerAt(taxLotExtent);
                
                var infoTemplate = new esri.InfoTemplate();
                
                infoTemplate.setTitle("${FacilityID}");
                infoTemplate.setContent("<b>Service Type: </b>${WaterType}<br/>"
                             + "<b>Service Class: </b>${ServiceClass}<br/>");
                graphic.setInfoTemplate(infoTemplate);
                map.infoWindow.resize(245, 105);
                map.infoWindow.setTitle(graphic.getTitle());
                map.infoWindow.setContent(graphic.getContent());
                map.infoWindow.show(taxLotExtent);
                               
        
        }



        function clear() {
            map.graphics.clear();
            map.infoWindow.hide();
        }

        function executeQueryTask(evt) {
            query2.geometry = evt.mapPoint;
            //Execute task and call showResults on completion
            queryTask2.execute(query2, showClickResults);
       }


       function showClickResults(featureSet) {

           map.graphics.clear();
           var features = featureSet.features;

           dojo.forEach(features, function (feature) {

                alert('hi');
               var ckgraphic = feature;
               var cksymbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color([255, 0, 0, .55]));
               ckgraphic.setSymbol(cksymbol);
               map.graphics.add(ckgraphic);

              // graphicAttributes = ckgraphic.attributes;
              // cbx = graphicAttributes.APN;
              // alert(cbx);

               // ckgraphic.setSymbol(cksymbol);
               // map.graphics.add(ckgraphic);

               // var taxLotExtent = ckgraphic.geometry;
               // map.setLevel(19);
               //  map.centerAt(taxLotExtent);

               //  var infoTemplate2 = new esri.InfoTemplate();

               //  infoTemplate2.setTitle("${FacilityID}");
               //  infoTemplate2.setContent("<b>Service Type: </b>${WaterType}<br/>"
               //                + "<b>Service Class: </b>${ServiceClass}<br/>");
               //  ckgraphic.setInfoTemplate(infoTemplate2);
               //  map.infoWindow.resize(245, 105);
               //  map.infoWindow.setTitle(ckgraphic.getTitle());
               //  map.infoWindow.setContent(ckgraphic.getContent());
               //  map.infoWindow.show(taxLotExtent);

           }

                    );
           queryTask.execute(query);
        }



  
        dojo.addOnLoad(init);
