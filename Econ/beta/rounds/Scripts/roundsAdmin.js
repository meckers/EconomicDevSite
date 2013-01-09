
dojo.require("esri.map");
dojo.require("dojox.grid.DataGrid");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("esri.tasks.find");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.form.Button");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.dijit.editing.TemplatePicker");


var findTask, findParams, map, startExtent, grid, store, updateFeature, form,widget, selected;


function init() {


    //proxy page to handle feature updates with the ArcGIS Server services.
    esri.config.defaults.io.proxyUrl = "proxy.ashx";


    dojo.connect(map, "onLoad", function () {
        //resize the map when the browser resizes
        dojo.connect(dijit.byId('mapDiv'), 'resize', map, map.resize);
    });

   dojo.connect(map, "onLayersAddResult", initEditing);  
   dojo.connect(grid, "onRowClick", onRowClickHandler);

    //Create map and add the ArcGIS Online imagery layer\
    startExtent = new esri.geometry.Extent({ "xmin": -12827050.59, "ymin": 3900275.81, "xmax": -12353752.51, "ymax": 4148237.53, "spatialReference": { "wkid": 3857} });
    map = new esri.Map("map", { extent: startExtent });

    var incidentLayer = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds6/FeatureServer/0", {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"],
        id: "incidentLayer"
    });

    var facLayer = new esri.layers.ArcGISDynamicMapServiceLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds6/MapServer");
    facLayer.setDisableClientCaching(true);

    var streetMapLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");

    map.addLayers([streetMapLayer, facLayer, incidentLayer]);
    incidentLayer.setSelectionSymbol(new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color("red")));

    esri.setRequestPreCallback(function (ioArgs) {
        if (ioArgs.url.indexOf('queryRelatedRecords') !== -1) {
            ioArgs.url = ioArgs.url.replace("FeatureServer", "MapServer");
        }
        return ioArgs;
    });

    
    //Create Find Task using the URL of the map service to search
    findTask = new esri.tasks.FindTask("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds6/MapServer");



    //Create the find parameters
    findParams = new esri.tasks.FindParameters();
    findParams.returnGeometry = true;
    findParams.layerIds = [0];
    findParams.searchFields = ["Name"];
    findParams.outSpatialReference = map.spatialReference;


    //working around an arcgis server feature service bug.  Requests to queryRelatedRecords operation fail with feature service 10.
    //Detect if request conatins the queryRelatedRecords operation and then change the source url for that request to the corresponding mapservice

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
            "<br><br><img style='cursor:pointer' src='../images/button.png'  onclick='javascript:voteOnIncident(" + graphicAttributes.OBJECTID + ");'>"
            ;

            map.infoWindow.setTitle(title);
            map.infoWindow.setContent(content);
            map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
        });
    });



}

function voteOnIncident(FacilityID) {

    var press1_element = document.getElementById('SystemPressure1');
    var press2_element = document.getElementById('SystemPressure2');
    var Activity_element = document.getElementById('Activity');
    var StorageTankLevel1 = document.getElementById('StorageTankLevel1');
    var StorageTankLevel2 = document.getElementById('StorageTankLevel2');
    var FreeClResidual1 = document.getElementById('FreeClResidual1');
    var FreeClResidual2 = document.getElementById('FreeClResidual2');
    var DistributionMeter1 = document.getElementById('DistributionMeter1');




    if (press1_element == null) {
        var press1 = 0;
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


    if (Activity_element == null) {
        var Activity = null;
    }
    else {
        var Activity = Activity_element.value;
    }
    if (StorageTankLevel1_element == null) {
        var StorageTankLevel1 = null;
    }
    else {
        var press2 = press2_element.value;
    }
    if (press2_element == null) {
        var press2 = null;
    }
    else {
        var press2 = press2_element.value;
    }
    if (press2_element == null) {
        var press2 = null;
    }
    else {
        var press2 = press2_element.value;
    }
    if (press2_element == null) {
        var press2 = null;
    }
    else {
        var press2 = press2_element.value;
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
        Date_: new Date().getTime(),
        SystemPressure1: press1,
        SystemPressure2: press2
    }
    };


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