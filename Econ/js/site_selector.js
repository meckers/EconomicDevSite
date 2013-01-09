dojo.require("dijit.dijit");
dojo.require("dijit.TitlePane");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.layout.AccordionContainer");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.Slider");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.form.MultiSelect");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.Dialog");
dojo.require("esri.map");
dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Legend");
dojo.require("esri.tasks.query");
dojo.require("esri.virtualearth.VETiledLayer");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.dijit.InfoWindowLite");
dojo.require("esri.layers.wms");
dojo.require("dojox.grid.DataGrid");
dojo.require("dojox.grid.EnhancedGrid");
dojo.require("dojox.grid.enhanced.plugins.exporter.CSVWriter");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojo.data.ItemFileWriteStore");



var map;
var legendLayers = [];
var queryTask, query;
var grid, store;
var sel;
var click, clickTask;
var ParClick, ParClickTask;
var ckgraphic;
var graphic; 



function init() {

    dijit.byId("disclaimer").show();

    dojo.connect(grid, "onRowClick", onRowClickHandler);

    dojo.ready(function () {

        var slider = new dijit.form.HorizontalSlider({
            name: "AreaSlider",
            value: 5,
            minimum: 0,
            maximum: 2000,
            intermediateChanges: true,
            style: "width:200px;",
            onChange: function (value) {
                dojo.byId("areaSlider").value = Math.round(value * 1) / 1;
            }
        }, "area1");


        var slider2 = new dijit.form.HorizontalSlider({
            name: "AreaSlider2",
            value: 200,
            minimum: 0,
            maximum: 2000,
            intermediateChanges: true,
            style: "width:200px;",
            onChange: function (value) {
                dojo.byId("areaSlider2").value = Math.round(value * 1) / 1;
            }
        }, "area2");


        var slider3 = new dijit.form.HorizontalSlider({
            name: "WaterSlider",
            value: 350,
            minimum: 0,
            maximum: 35000,
            intermediateChanges: true,
            style: "width:200px;",
            onChange: function (value) {
                dojo.byId("waterSlider").value = Math.round(value * 1) / 1;
            }
        }, "water");

        var slider4 = new dijit.form.HorizontalSlider({
            name: "SewerSlider",
            value: 350,
            minimum: 0,
            maximum: 35000,
            intermediateChanges: true,
            style: "width:200px;",
            onChange: function (value) {
                dojo.byId("sewerSlider").value = Math.round(value * 1) / 1;
            }
        }, "sewer");

        var slider5 = new dijit.form.HorizontalSlider({
            name: "ElecSlider",
            value: 250,
            minimum: 0,
            maximum: 35000,
            intermediateChanges: true,
            style: "width:200px;",
            onChange: function (value) {
                dojo.byId("elecSlider").value = Math.round(value * 1) / 1;
            }
        }, "elec");

        var slider6 = new dijit.form.HorizontalSlider({
            name: "TelSlider",
            value: 250,
            minimum: 0,
            maximum: 35000,
            intermediateChanges: true,
            style: "width:200px;",
            onChange: function (value) {
                dojo.byId("telSlider").value = Math.round(value * 1) / 1;
            }
        }, "tel");

    });


    //set up map
    var initialExtent = new esri.geometry.Extent({ "xmin": -112.1293, "ymin": 32.9765, "xmax": -111.9111, "ymax": 33.1014, "spatialReference": { "wkid": 4326} });
    map = new esri.Map("map", { extent: esri.geometry.geographicToWebMercator(initialExtent) });

    //Add the terrain service to the map. View the ArcGIS Online site for services http://arcgisonline/home/search.html?t=content&f=typekeywords:service    
    var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
    map.addLayer(basemap);


    var zoning = new esri.layers.FeatureLayer("https://globalwateresri.gwfathom.net/ArcGIS/rest/services/City_of_Maricopa/maricopa/MapServer/5", {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    legendLayers.push({ layer: zoning, title: "Zoning" });


    var flood = new esri.layers.FeatureLayer("https://globalwateresri.gwfathom.net/ArcGIS/rest/services/City_of_Maricopa/maricopa/MapServer/2", {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    legendLayers.push({ layer: flood, title: "Flood Hazard Areas" });



    var UnDevPar = new esri.layers.FeatureLayer("https://globalwateresri.gwfathom.net/ArcGIS/rest/services/City_of_Maricopa/maricopa/MapServer/4", {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    legendLayers.push({ layer: UnDevPar, title: "Undeveloped Commercial Parcels" });



    var reDevLayer = new esri.layers.FeatureLayer("https://globalwateresri.gwfathom.net/ArcGIS/rest/services/City_of_Maricopa/maricopa/MapServer/1", {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });

    //legendLayers.push({ layer: reDevLayer, title: "Redevelopment District" });


   // var boundLayer = new esri.layers.FeatureLayer("https://globalwateresri.gwfathom.net/ArcGIS/rest/services/City_of_Maricopa/maricopa/MapServer/0", {
   //     mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
   //     outFields: ["*"]
   // });


    // legendLayers.push({ layer: boundLayer, title: "City of Maricopa Boundary" });

    //transparent layer to get around legend bug
    var bug = new esri.layers.FeatureLayer("https://globalwateresri.gwfathom.net/ArcGIS/rest/services/City_of_Maricopa/maricopa/MapServer/7", {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
    });




    //wms layers for fast display

    var parcels = new esri.layers.WMSLayerInfo({ name: "1", title: "Parcels" });
    var bound = new esri.layers.WMSLayerInfo({ name: "7", title: "Boundary" });
    var redev = new esri.layers.WMSLayerInfo({ name: "6", title: "Redevelopment" });

    var resourceInfo = {
        extent: new esri.geometry.Extent(-126.40869140625, 31.025390625, -109.66552734375, 41.5283203125, { wkid: 4326 }),
        layerInfos: [parcels, bound, redev]
    };

    var par = new esri.layers.WMSLayer("https://globalwateresri.gwfathom.net/ArcGIS/services/City_of_Maricopa/maricopa/MapServer/WMSServer",
          { resourceInfo: resourceInfo,
              visibleLayers: ["1"]
          }
        );

    var boundary = new esri.layers.WMSLayer("https://globalwateresri.gwfathom.net/ArcGIS/services/City_of_Maricopa/maricopa/MapServer/WMSServer",
          { resourceInfo: resourceInfo,
              visibleLayers: ["7"]
          }
        );

    var redevs = new esri.layers.WMSLayer("https://globalwateresri.gwfathom.net/ArcGIS/services/City_of_Maricopa/maricopa/MapServer/WMSServer",
          { resourceInfo: resourceInfo,
              visibleLayers: ["6"]
          }
        );


    legendLayers.push({ layer: par, title: "Parcels" });
    legendLayers.push({ layer: redevs, title: "Redevelopment District" });
    //  legendLayers.push({ layer: boundary, title: "Maricopa City boundary" });

    //layer for the undeveloped parcels click 
    graphic = new esri.layers.GraphicsLayer();
    
    
    map.addLayers([boundary, bug]);


    createBasemapGallery();


    dojo.connect(map, 'onLayersAddResult', function (results) {
        var legend = new esri.dijit.Legend({
            map: map,
            layerInfos: legendLayers
        }, "legendDiv");
        legend.startup();
    });


    dojo.connect(map, 'onLayersAddResult', function (results) {

        //add check boxes
        dojo.forEach(legendLayers, function (layer) {
            var layerName = layer.title;
            var checkBox = new dijit.form.CheckBox({
                name: "checkBox" + layer.layer.id,
                value: layer.layer.id,
                checked: layer.layer.defaultVisibility,
                onChange: function (evt) {
                    var clayer = map.getLayer(this.value);
                    ck = this.checked;
                    //alert(layer.title);

                    if (ck == true) {

                        map.addLayer(layer.layer);

                        // alert(layer.layer);
                        // alert(layer.layer.id); 

                    }
                    if (ck != true) {

                        map.removeLayer(layer.layer);

                    }

                }
            });

            //add the check box and label to the toc
            dojo.place(checkBox.domNode, dojo.byId("toggle"), "after");
            var checkLabel = dojo.create('label', { 'for': checkBox.name, innerHTML: layerName }, checkBox.domNode, "after");
            dojo.place("<br />", checkLabel, "after");
        });

    });

    dojo.connect(map, 'onLoad', function (theMap) {
        //resize the map when the browser resizes
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
    queryTask = new esri.tasks.QueryTask("https://globalwateresri.gwfathom.net/ArcGIS/rest/services/City_of_Maricopa/MaricopaEconDev/MapServer/5");

    // dojo.connect(queryTask, "onComplete", showResults);

    //build query filter
    query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.outSpatialReference = map.spatialReference;
    query.outFields = ["*"];


    //set query for map click
 //   dojo.connect(map, "onClick", executeClickTask);
 //   clickTask = new esri.tasks.QueryTask("https://globalwateresri.gwfathom.net/ArcGIS/rest/services/City_of_Maricopa/MaricopaEconDev/MapServer/6");
 //   click = new esri.tasks.Query();
 ///   click.returnGeometry = true;
 //   click.outSpatialReference = map.spatialReference;
 //   click.outFields = ["*"];

    //set query for MEDA parcel map click
    dojo.connect(map, "onClick", executeClickTask2);
    ParClickTask = new esri.tasks.QueryTask("https://globalwateresri.gwfathom.net/ArcGIS/rest/services/City_of_Maricopa/maricopa/MapServer/3");
    ParClick = new esri.tasks.Query();
    ParClick.returnGeometry = true;
    ParClick.outSpatialReference = map.spatialReference;
    ParClick.outFields = ["*"];

    //graphic symbol for map click 
    cksymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 255, 0, 0.5]));


}


//function executeClickTask(evt) {
    //onClick event returns the evt point where the user clicked on the map.
    //This is contains the mapPoint (esri.geometry.point) and the screenPoint (pixel xy where the user clicked).
    //set query geometry = to evt.mapPoint Geometry
   // click.geometry = evt.mapPoint;

    //Execute task and call showResults on completion
    
   // clickTask.execute(click,ckResults);
//}


//function ckResults(featureSet) {

 ////   graphic.clear();

 //   dojo.connect(map, "onExtentChange", function () { map.infoWindow.hide(); });
 //   dojo.forEach(featureSet.features, function (feature) {

        
      //  var ResGraphic = [];
      //  ResGraphic = feature;
     //   map.addLayer(graphic);
     //   graphic.add(new esri.Graphic(ResGraphic.geometry, cksymbol));
        


        //create graphic to get attributes for for side bar 
      //  Tsymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([255, 0, 0, 0]), 2), new dojo.Color([255, 255, 0, 0]));

     //   ckgraphic = feature;
     //  ckgraphic.setSymbol(Tsymbol);
     //   map.graphics.add(ckgraphic);



     //   CKgraphicAttributes = ckgraphic.attributes;
      //  var CKcontent = "<strong>Parcel Number: </strong>" + CKgraphicAttributes.APN + "<br>"
      //  + "<strong>Zoning: </strong>" + CKgraphicAttributes.Zoning + "<br>"
      //  + "<strong>Pre-Application Completed: </strong>" + CKgraphicAttributes.Pre_App + "<br>"
      //  + "<strong>Zoning Pre-Plat Completed: </strong>" + CKgraphicAttributes.Z_Pre_Plat + "<br>"
      //  + "<strong>Zoning Final Plat Approved: </strong>" + CKgraphicAttributes.Z_Final_Plat + "<br>"
      //  + "<strong>Temporary Use Permit Issued: </strong>" + CKgraphicAttributes.Temp_Use_P + "<br>"
      //  + "<strong>Conditional Use Permit Issued: </strong>" + CKgraphicAttributes.C_Use_P + "<br>"
      //  + "<strong>Site Plan Approved: </strong>" + CKgraphicAttributes.Site_Plan + "<br>"
       // + "<strong>Building Pre-Review Completed: </strong>" + CKgraphicAttributes.Bldg_PRev + "<br>"
      //  + "<strong>Construction Underway: </strong>" + CKgraphicAttributes.Construct + "<br>"
      //  + "<strong>Property Rezoned: </strong>" + CKgraphicAttributes.Rezone + "<br>";


     //   dojo.html.set(dojo.byId("yup"), CKcontent);
   //     var accordion = dijit.byId("yes");
    //    accordion.selectChild("yup");


   //   var txExtent = ckgraphic.geometry;
   //   ckpt = txExtent.getExtent();
   //   ctr = ckpt.getCenter();

        //center map 
   //    map.centerAt(ctr);
  //      map.setExtent(ckpt.expand(5));


  //  });
 // }


function executeClickTask2(evt) {


    ParClick.geometry = evt.mapPoint;
    ParClickTask.execute(ParClick, ckResults2);
}




function ckResults2(featureSet) {
    graphic.clear();
 //
    dojo.connect(map, "onExtentChange", function () { map.infoWindow.hide(); });
    dojo.forEach(featureSet.features, function (feature) {


      var ResGraphic = [];
        ResGraphic = feature;
        map.addLayer(graphic);
        graphic.add(new esri.Graphic(ResGraphic.geometry, cksymbol));
        // 


        //create graphic to get attributes for for side bar 
        Tsymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([255, 0, 0, 0]), 2), new dojo.Color([255, 255, 0, 0]));

        ckgraphic = feature;
       ckgraphic.setSymbol(Tsymbol);
        map.graphics.add(ckgraphic);



        CKgraphicAttributes = ckgraphic.attributes;
        var CKcontent = "<div><strong>" + CKgraphicAttributes.Address + "</strong>" + "<br><br>"
           + "<strong>Parcel Number: </strong>" + CKgraphicAttributes.Parcel_Number + "<br>"
            + "<strong>Acreage: </strong>" + CKgraphicAttributes.Acreage + "<br>"
           
           + "<strong>Owner Name: </strong>" + CKgraphicAttributes.Owner_Name + "<br>"
            + "<strong>Owner City: </strong>" + CKgraphicAttributes.Owner_City + "<br>"
            + "<strong>Zoning: </strong>" + CKgraphicAttributes.Zoning_Class + "<br>"
            + "<strong>Nearest Highway: </strong>" + CKgraphicAttributes.Hwy_Name + "<br>"
            + "<strong>Feet to Nearest highway: </strong>" + CKgraphicAttributes.Nearest_Hwy_Distance + "<br>"
          + "<strong>Nearest Rail Provider: </strong>" + CKgraphicAttributes.Rail_Carrier_Name + "<br>"
            + "<strong>Feet to Rail Provider: </strong>" + CKgraphicAttributes.Rail_Distance_to_Site + "<br>"
            + "<strong>Water Provider: </strong>" + CKgraphicAttributes.Water_Provider + "<br>"
            + "<strong>Feet to Water Provider: </strong>" + CKgraphicAttributes.Water_Proximity_Feet + "<br>"
           + "<strong>Sewer Provider: </strong>" + CKgraphicAttributes.Sewer_Provider + "<br>"
           + "<strong>Feet to Sewer Provider: </strong>" + CKgraphicAttributes.Sewer_Proximity_Feet + "<br>"
              + "<strong>Cost to Bring Sewer to Site: </strong>$" + CKgraphicAttributes.Sewer_Cost_to_Site + "<br>"
             + "<strong>Electric Provider: </strong>" + CKgraphicAttributes.Electric_Service_Provider + "<br>"
              + "<strong>Feet to Electric Provide: </strong>" + CKgraphicAttributes.Electric_Proximity_Feet + "<br>"
            + "<strong>Telecom Provider: </strong>" + CKgraphicAttributes.Telecom_Local_Exchange_Carrier + "<br>"
             + "<strong>Feet to Telecom Provider: </strong>" + CKgraphicAttributes.Telecom_Proximity_Feet + "<br>"
             + "<strong>Feet to Fire Services: </strong>" + CKgraphicAttributes.Fire_Proximity_Feet + "<br>"
             + "<strong>Feet to Police Services: </strong>" + CKgraphicAttributes.Police_Proximity_Feet + "<br></div>";


         dojo.html.set(dojo.byId("yup"), CKcontent);
          var accordion = dijit.byId("yes");
         accordion.selectChild("yup");
 

         var txExtent = ckgraphic.geometry;
          ckpt = txExtent.getExtent();
         ctr = ckpt.getCenter();

        //center map 
        map.centerAt(ctr);
         map.setExtent(ckpt.expand(5));


     });

 }








function executeQuery() {


    var area = dojo.byId("areaSlider").value;
    var area2 = dojo.byId("areaSlider2").value;

    var water = dojo.byId("waterSlider").value;
    var sewer = dojo.byId("sewerSlider").value;
    var elec = dojo.byId("elecSlider").value;
    var tel = dojo.byId("telSlider").value;

    var zone = dojo.fieldToObject(dojo.byId("zform").zone);


    query.where = "Zoning_Class in( " + zone + ") and Acreage > " + area + " and Acreage < " + area2 + " and Sewer_Proximity_Feet < " + sewer + " and Water_Proximity_Feet < " + water + " and Electric_Proximity_Feet < " + elec + " and Telecom_Proximity_Feet < " + tel;
    //execute query
    queryTask.execute(query, showResults);



}


function showResults(results) {


    map.graphics.clear();
    var items = [];
    var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 0, 0, 0.125]));

    var num = results.features.length;
    if (num == 0) { alert("Your search produced no results"); }

    for (var i = 0, il = results.features.length; i < il; i++) {
        items.push(results.features[i].attributes);


       // ResGraphic = results.features[i];
       // var graphic = new esri.layers.GraphicsLayer();
      //  map.addLayer(graphic);
       // graphic.add(new esri.Graphic(ResGraphic.geometry,symbol));
       // graphicAttributes = graphic.attributes;


        //hack to get around grid click issue
        var TransSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0,0]), 2), new dojo.Color([255, 0, 0, 0]));
        var TransGraphic = results.features[i];
        TransGraphic.setSymbol(symbol);
        map.graphics.add(TransGraphic);
 
    }

    var data = {
        identifier: "Parcel_Number",  //This field needs to have unique values
        label: "Parcel_Number", //Name field for display. Not pertinent to a grid but may be used elsewhere.
        items: items
    };

    store = new dojo.data.ItemFileReadStore({ data: data });
    var grid = dijit.byId('grid');
    grid.setStore(store);

    var backExtent = new esri.geometry.Extent({ "xmin": -112.1293, "ymin": 32.9765, "xmax": -111.9111, "ymax": 33.1014, "spatialReference": { "wkid": 4326} });
    map.setExtent(esri.geometry.geographicToWebMercator(backExtent));

}



function onRowClickHandler(evt) {


    var clickedTaxLotId = grid.getItem(evt.rowIndex).Parcel_Number;
    dojo.forEach(map.graphics.graphics, function (graphic) {
        if ((graphic.attributes) && graphic.attributes.Parcel_Number === clickedTaxLotId) {
            selectedTaxLot = graphic;
            return;
        }
    });


    selgraphic = selectedTaxLot;
    var selsymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 255]), 4), new dojo.Color([255, 255, 0, 0.5]));

    //  selgraphic.setSymbol(selsymbol);
    //  map.graphics.add(selgraphic);
    // graphicAttributes = selgraphic.attributes;
    // alert(graphicAttributes.Address);




    var sel = new esri.layers.GraphicsLayer();
    map.addLayer(sel);
    sel.add(new esri.Graphic(selectedTaxLot.geometry, selsymbol));


    var taxLotExtent = selectedTaxLot.geometry.getExtent();

    taxEX = taxLotExtent.getExtent();
    taxCTR = taxEX.getCenter();


    map.setExtent(taxLotExtent.expand(5));

    //info window stuff, currently deactivated

    var infoTemplate = new esri.InfoTemplate();
    infoTemplate.setTitle("<b>${Address}</b>");
    infoTemplate.setContent("<b>Parcel Number: </b>${Parcel_Number}<br>"
            + "<b>Acreage: </b>${Acreage} <br>"
            + "<b>Owner Name: </b>${Owner_Name}<br>"
            + "<b>Owner City: </b>${Owner_City}<br>"
            + "<b>Zoning: </b>${Zoning_Class}<br>"
            + "<b>Nearest Highway: </b>${Hwy_Name}<br>"
            + "<b>Feet to Nearest highway: </b>${Nearest_Hwy_Distance}<br>"
            + "<b>Nearest Rail Provider: </b>${Rail_Carrier_Name}<br>"
            + "<b>Feet to Rail Provider: </b>${Rail_Distance_to_Site}<br>"
            + "<b>Water Provider: </b>${Water_Provider}<br>"
            + "<b>Feet to Water Provider: </b>${Water_Proximity_Feet}<br>"
            + "<b>Sewer Provider: </b>${Sewer_Provider}<br>"
            + "<b>Feet to Sewer Provider: </b>${Sewer_Proximity_Feet}<br>"
            + "<b>Cost to Bring Sewer to Site: </b>$${Sewer_Cost_to_Site}<br>"
            + "<b>Electric Provider: </b>${Electric_Service_Provider}<br>"
            + "<b>Feet to Electric Provide: </b>${Electric_Proximity_Feet}<br>"
            + "<b>Telecom Provider: </b>${Telecom_Local_Exchange_Carrier}<br>"
            + "<b>Feet to Telecom Provider: </b>${Telecom_Proximity_Feet}<br>"
            + "<b>Feet to Fire Services: </b>${Fire_Proximity_Feet}<br>"
            + "<b>Feet to Police Services: </b>${Police_Proximity_Feet}<br>");

    graphicattributes = selgraphic.attributes;
    var content = "<div><strong>" + graphicattributes.Address + "</strong>" + "<br><br>"
           + "<strong>Parcel Number: </strong>" + graphicattributes.Parcel_Number + "<br>"
            + "<strong>Acreage: </strong>" + graphicattributes.Acreage + "<br>"
            + "<strong>Shovel Ready: </strong>" + graphicattributes.Shovel_Ready + "<br>"
            + "<strong>Owner Name: </strong>" + graphicattributes.Owner_Name + "<br>"
            + "<strong>Owner City: </strong>" + graphicattributes.Owner_City + "<br>"
            + "<strong>Zoning: </strong>" + graphicattributes.Zoning_Class + "<br>"
            + "<strong>Nearest Highway: </strong>" + graphicattributes.Hwy_Name + "<br>"
            + "<strong>Feet to Nearest highway: </strong>" + graphicattributes.Nearest_Hwy_Distance + "<br>"
            + "<strong>Nearest Rail Provider: </strong>" + graphicattributes.Rail_Carrier_Name + "<br>"
            + "<strong>Feet to Rail Provider: </strong>" + graphicattributes.Rail_Distance_to_Site + "<br>"
            + "<strong>Water Provider: </strong>" + graphicattributes.Water_Provider + "<br>"
            + "<strong>Feet to Water Provider: </strong>" + graphicattributes.Water_Proximity_Feet + "<br>"
            + "<strong>Sewer Provider: </strong>" + graphicattributes.Sewer_Provider + "<br>"
            + "<strong>Feet to Sewer Provider: </strong>" + graphicattributes.Sewer_Proximity_Feet + "<br>"
            + "<strong>Cost to Bring Sewer to Site: </strong>$" + graphicattributes.Sewer_Cost_to_Site + "<br>"
            + "<strong>Electric Provider: </strong>" + graphicattributes.Electric_Service_Provider + "<br>"
            + "<strong>Feet to Electric Provide: </strong>" + graphicattributes.Electric_Proximity_Feet + "<br>"
            + "<strong>Telecom Provider: </strong>" + graphicattributes.Telecom_Local_Exchange_Carrier + "<br>"
            + "<strong>Feet to Telecom Provider: </strong>" + graphicattributes.Telecom_Proximity_Feet + "<br>"
            + "<strong>Feet to Fire Services: </strong>" + graphicattributes.Fire_Proximity_Feet + "<br>"
            + "<strong>Feet to Police Services: </strong>" + graphicattributes.Police_Proximity_Feet + "<br></div>";


    // alert(yup);

    dojo.html.set(dojo.byId("yup"), content);

    var accordion = dijit.byId("yes");
    accordion.selectChild("yup");




    selgraphic.setInfoTemplate(infoTemplate);

    //  map.infoWindow.resize(270, 450);
    //  map.infoWindow.setTitle(selgraphic.getTitle());
    //  map.infoWindow.setContent(selgraphic.getContent());

    //       dojo.connect(map, "onExtentChange", function () {

    //        var anchor = '';
    //       anchor = new esri.geometry.Point(map.extent.xmax, map.extent.ymin, new esri.SpatialReference({
    //            "wkt": "PROJCS[\"NAD_1983_StatePlane_Arizona_Central_FIPS_0202_IntlFeet\",GEOGCS[\"GCS_North_American_1983\",DATUM[\"D_North_American_1983\",SPHEROID[\"GRS_1980\",6378137.0,298.257222101]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"False_Easting\",700000.0],PARAMETER[\"False_Northing\",0.0],PARAMETER[\"Central_Meridian\",-111.9166666666667],PARAMETER[\"Scale_Factor\",0.9999],PARAMETER[\"Latitude_Of_Origin\",31.0],UNIT[\"Foot\",0.3048]]"
    //        }))
    //
    //        map.infoWindow.show(anchor);
    //        map.infoWindow.setFixedAnchor(esri.dijit.InfoWindow.ANCHOR_UPPERLEFT);

    //     });



    dojo.connect(grid, "onRowClick", clearGraphics);
    dojo.connect(map, "onClick", clearGraphics);
    function clearGraphics() {



        if (map.graphics) { sel.clear(); };
    }


}


function exportAll() {

    alert('Please save data on your file system and change the extension type to .csv.');
    dijit.byId("grid").exportGrid("csv", function (str) {
        dojo.byId("output").value = str;
        location.href = 'data:application/download,' + encodeURIComponent(str);
    });
};



function clearQuery() {


    map.graphics.clear();

    clearTask = new esri.tasks.QueryTask("https://globalwateresri.gwfathom.net/ArcGIS/rest/services/City_of_Maricopa/MaricopaEconDev/MapServer/5");
    clear = new esri.tasks.Query();
    clear.returnGeometry = true;
    clear.outSpatialReference = map.spatialReference;
    clear.outFields = ["*"];
    clear.where = "Zoning_Class = 'Josh'";
    clearTask.execute(clear, clearResults);


    var items = [];
    var data = {
        identifier: "Parcel_Number",  //This field needs to have unique values
        label: "Parcel_Number", //Name field for display. Not pertinent to a grid but may be used elsewhere.
        items: items
    };

    store = new dojo.data.ItemFileReadStore({ data: data });
    var grid = dijit.byId('grid');
    grid.setStore(store);

    map.removeAllLayers();

    


}





function clearResults(results) {

   
     var backExtent = new esri.geometry.Extent({ "xmin": -112.1293, "ymin": 32.9765, "xmax": -111.9111, "ymax": 33.1014, "spatialReference": { "wkid": 4326} });
    map.setExtent(esri.geometry.geographicToWebMercator(backExtent));

    dojo.connect(map, "onExtentChange", function () { map.infoWindow.hide(); });
    

    var basemap = new esri.layers.ArcGISTiledMapServiceLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
    map.addLayer(basemap);

   
    var bound = new esri.layers.WMSLayerInfo({ name: "7", title: "Boundary" });
 

    var resourceInfo = {
        extent: new esri.geometry.Extent(-126.40869140625, 31.025390625, -109.66552734375, 41.5283203125, { wkid: 4326 }),
        layerInfos: [bound]
    };

 

    var boundary = new esri.layers.WMSLayer("https://globalwateresri.gwfathom.net/ArcGIS/services/City_of_Maricopa/maricopa/MapServer/WMSServer",
          { resourceInfo: resourceInfo,
              visibleLayers: ["7"]
          }
        );

    map.addLayer(boundary);


    dijit.byId("area1").set('value', 0);
    dojo.byId("areaSlider").value = Math.round(0 * 1) / 1;

    dijit.byId("area2").set('value', 200);
    dojo.byId("areaSlider2").value = Math.round(1 * 200) / 1;

    dijit.byId("water").set('value', 350);
    dojo.byId("waterSlider").value = Math.round(1 * 350) / 1;

    dijit.byId("sewer").set('value', 350);
    dojo.byId("sewerSlider").value = Math.round(1 * 350) / 1;

    dijit.byId("elec").set('value', 350);
    dojo.byId("elecSlider").value = Math.round(1 * 350) / 1;

    dijit.byId("tel").set('value', 350);
    dojo.byId("telSlider").value = Math.round(1 * 350) / 1;

    dojo.html.set(dojo.byId("yup"), '');

    cg();
    

}


function cg() {


    if (map.graphics) { sel.clear(); map.graphics.clear(); map.graphic.clear(); };

   
}


dojo.addOnLoad(init);
        
   

   