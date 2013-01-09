     dojo.require("esri.dijit.editing.Editor-all");
      dojo.require("dijit.layout.BorderContainer");
      dojo.require("dijit.layout.ContentPane");
      dojo.require("esri.SnappingManager");


      var map;

      function init() {
        //snapping is enabled for this sample - change the tooltip to reflect this
        esri.bundle.toolbars.draw.start = esri.bundle.toolbars.draw.start +  "<br/>Press <b>CTRL</b> to enable snapping";
        esri.bundle.toolbars.draw.addPoint = esri.bundle.toolbars.draw.addPoint +  "<br/>Press <b>CTRL</b> to enable snapping";
           
        //This sample requires a proxy page to handle communications with the ArcGIS Server services. You will need to  
        //replace the url below with the location of a proxy on your machine. See the 'Using the proxy page' help topic 
        //for details on setting up a proxy page.
        
        //esri.config.defaults.io.proxyUrl = "/arcgisserver/apis/javascript/proxy/proxy.ashx";

        //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications
        esri.config.defaults.geometryService = new esri.tasks.GeometryService("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/Geometry/GeometryServer");


        var extent = new esri.geometry.Extent({
           "xmin": -13481867.837,
          "ymin": 4749159.259,
          "xmax": -13469419.297,
          "ymax": 4757068.626,
          "spatialReference": {
            "wkid": 102100
          }
        });
        
      
        map = new esri.Map("map", {
          extent: extent
        });
        dojo.connect(map, "onLoad", function() {
          //resize the map when the browser resizes
          dojo.connect(dijit.byId('map'), 'resize', map,map.resize);
        });
      dojo.connect(map, "onLayersAddResult", initEditing);

        var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
        map.addLayer(basemap);


        var operationsPointLayer = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds/FeatureServer/0", {
          mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
          outFields: ["*"]
        });

        //var operationsLineLayer = new esri.layers.FeatureLayer("http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/HomelandSecurity/operations/FeatureServer/1", {
          //mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
          //outFields: ["*"]
        //});
      var operationsPolygonLayer = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds/FeatureServer/1", {
          mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
          outFields: ["*"]
        });


        map.addLayers([operationsPointLayer, operationsPolygonLayer]);
        map.infoWindow.resize(400, 300);
      }

      function initEditing(results) {
        var featureLayerInfos = dojo.map(results, function(result) {
          return {
            'featureLayer': result.layer
          };
        });

        var settings = {
          map: map,
          layerInfos: featureLayerInfos
        };

        var params = {
          settings: settings
        };

        var editorWidget = new esri.dijit.editing.Editor(params, 'editorDiv');
        
        var options = {snapKey:dojo.keys.copyKey};
        map.enableSnapping(options);
        
        editorWidget.startup();

      }

      dojo.addOnLoad(init);
    