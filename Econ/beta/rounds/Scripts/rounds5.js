﻿dojo.require("esri.map");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.dijit.editing.TemplatePicker");
dojo.require("dojox.grid.DataGrid");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("esri.tasks.find");
dojo.require("dijit.form.Button");


var widget, selected;
var map;
var findTask, findParams,grid, store;


function init() {
    //This sample requires a proxy page to handle communications with the ArcGIS Server services. You will need to
    //replace the url below with the location of a proxy on your machine. See the 'Using the proxy page' help topic
    //for details on setting up a proxy page.
    esri.config.defaults.io.proxyUrl = "proxy.ashx";


    var extent = new esri.geometry.Extent(-12827050.59, 3900275.81, -12353752.51, 4148237.53, new esri.SpatialReference({ wkid: 3857 }));
    var map = new esri.Map("map", { extent: new esri.geometry.Extent(extent) });

    dojo.connect(map, "onLoad", function () {
        //resize the map when the browser resizes
        dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
    });


    dojo.connect(map, "onLayersAddResult", initEditing);
 

    var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
    var incidentLayer = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds6/FeatureServer/0", {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"],
        id: "incidentLayer"
    });
    
    incidentLayer.setSelectionSymbol(new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color("red")));

    var facLayer = new esri.layers.ArcGISDynamicMapServiceLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds6/MapServer");
    facLayer.setDisableClientCaching(true);

    map.addLayers([basemap, incidentLayer, facLayer]);


    findTask = new esri.tasks.FindTask("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds6/MapServer");



    //Create the find parameters
    findParams = new esri.tasks.FindParameters();
    findParams.returnGeometry = true;
    findParams.layerIds = [0];
    findParams.searchFields = ["Name"];
    findParams.outSpatialReference = map.spatialReference;


    //working around an arcgis server feature service bug.  Requests to queryRelatedRecords operation fail with feature service 10.
    //Detect if request conatins the queryRelatedRecords operation and then change the source url for that request to the corresponding mapservice
    esri.setRequestPreCallback(function (ioArgs) {
        if (ioArgs.url.indexOf('queryRelatedRecords') !== -1) {
            ioArgs.url = ioArgs.url.replace("FeatureServer", "MapServer");
        }
        return ioArgs;
    });
}


function doFind() {
    //Set the search text to the value in the box
    findParams.searchText = dojo.byId("ownerName").value;
    findTask.execute(findParams, showResults);
}

function showResults(results) {
    //This function works with an array of FindResult that the task returns
    map.graphics.clear();
    var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([98, 194, 204]), 2), new dojo.Color([98, 194, 204, 0.5]));

    //create array of attributes
    var items = dojo.map(results, function (result) {
        var graphic = result.feature;
        graphic.setSymbol(symbol);
        map.graphics.add(graphic);
        return result.feature.attributes;
    });


    //Create data object to be used in store
    var data = {
        identifier: "OBJECTID",  //This field needs to have unique values
        label: "OBJECTID", //Name field for display. Not pertinent to a grid but may be used elsewhere.
        items: items
    };

    //Create data store and bind to grid.
    store = new dojo.data.ItemFileReadStore({ data: data });
    var grid = dijit.byId('grid');
    grid.setStore(store);


    //Zoom back to the initial map extent
    //map.setExtent(startExtent);

    dojo.forEach(map.graphics.graphics, function (graphic) {
        selectedTaxLot = graphic;
        return;
    });

    map.setExtent(selectedTaxLot.geometry.getExtent().expand(28));
    map.graphics.clear();

}

//Zoom to the parcel when the user clicks a row
function onRowClickHandler(evt) {
    var clickedTaxLotId = grid.getItem(evt.rowIndex).OBJECTID;
    var selectedTaxLot;

    dojo.forEach(map.graphics.graphics, function (graphic) {
        if ((graphic.attributes) && graphic.attributes.OBJECTID === clickedTaxLotId) {
            selectedTaxLot = graphic;
            return;
        }
    });


    map.setExtent(selectedTaxLot.geometry.getExtent().expand(28));
}


function initEditing(layers) {
    map = this;
    map.infoWindow.resize(300, 210);
    var incidentLayer = map.getLayer("incidentLayer");
    generateTemplatePicker(incidentLayer);
    dojo.connect(map, "onClick", function (evt) {
        
        if (selected) {
            var currentDate = new Date();
            var incidentAttributes = {
                Name: selected.template.name,
                DateLastEdited: (currentDate.getMonth() + 1) + "/" + currentDate.getDate() + "/" + currentDate.getFullYear()
            };

           var incidentGraphic = new esri.Graphic(evt.mapPoint, selected.symbol, incidentAttributes);
           incidentLayer.applyEdits([incidentGraphic], null, null);
        }
    });

    var title, content, graphicAttributes;
    var relatedQuery = new esri.tasks.RelationshipQuery();
    relatedQuery.outFields = ["*"];
    //relatedQuery.outFields = ["FacilityID"];
    relatedQuery.relationshipId = 1;

    dojo.connect(incidentLayer, "onClick", function (evt) {
    graphicAttributes = evt.graphic.attributes;

        var now = new Date();
        title = graphicAttributes.Name;
        html = graphicAttributes.HTML;
        html2 = graphicAttributes.HTML2;
       
        content = "<b>Facility Name: </b>" + graphicAttributes.Name
                  + "<br><b>FacilityID: </b>" + graphicAttributes.FacilityID
                  + "<br><b>Date Edited: </b>" + (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear()
                  + "<br> -------------<br>"
                  + html2


        relatedQuery.objectIds = [graphicAttributes.OBJECTID];
        incidentLayer.queryRelatedFeatures(relatedQuery, function (relatedRecords) {
            var fset = relatedRecords[graphicAttributes.OBJECTID];
            var count = (fset) ? fset.features.length : 0;

            content = content +
            "<br><br><img style='cursor:pointer' src='http://www.jmautomotive.com/Dealer-Websites/J+Mautomotive/images/submit-button.jpg'  onclick='javascript:voteOnIncident(" + "&quot;" + graphicAttributes.FacilityID + "&quot;" + ");'>";

            map.infoWindow.setTitle(title);
            map.infoWindow.setContent(content);
            map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
        });
    });

   
   
}



function voteOnIncident(FacilityID) {

    var press1_element = document.getElementById('SystemPressure1');
    var press2_element = document.getElementById('SystemPressure2');
  

    

  if (press1_element == null) {
       var press1 = null;
   }
    else {
       var press1 = press1_element.value;
   }


   if (press2_element == null) {
        var press2 = null;
   }
    else {
        var press2 = press2_element.value; 
    }



   // alert(press1);
    //alert(press2);
    var voteRecord = { attributes: {
        FacilityID: FacilityID,
        iwaterID: FacilityID,
        Date_: new Date().getTime(),
        SystemPressure1: press1,
        SystemPressure2: press2
        } };


var incidentVoteTable = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds6/FeatureServer/1");
incidentVoteTable.applyEdits([voteRecord]);

}

function generateTemplatePicker(layer) {
    console.log(layer);
    widget = new esri.dijit.editing.TemplatePicker({
        featureLayers: [layer],
        rows: "auto",
        columns: 1,
        grouping: false,
        style: "width:98%;"
    }, "templatePickerDiv");

    widget.startup();

    dojo.connect(widget, "onSelectionChange", function () {
        selected = widget.getSelected();
        console.log(selected);
    });
}

dojo.addOnLoad(init);