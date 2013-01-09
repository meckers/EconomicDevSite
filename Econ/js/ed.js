dojo.require("esri.map");
dojo.require("dojox.grid.DataGrid");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("esri.tasks.find");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.form.Button");


var findTask, findParams;
var map, startExtent;
var grid, store;

function init() {
    dojo.connect(grid, "onRowClick", onRowClickHandler);

    //Create map and add the ArcGIS Online imagery layer
    startExtent = new esri.geometry.Extent({ "xmin": -9280047, "ymin": 5238205, "xmax": -9258205, "ymax": 5254696, "spatialReference": { "wkid": 102100} });
    map = new esri.Map("map", { extent: startExtent });

    var streetMapLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
    map.addLayer(streetMapLayer);

    //Create Find Task using the URL of the map service to search
    findTask = new esri.tasks.FindTask("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/TaxParcel/TaxParcelQuery/MapServer/");

    //Create the find parameters
    findParams = new esri.tasks.FindParameters();
    findParams.returnGeometry = true;
    findParams.layerIds = [0];
    findParams.searchFields = ["OWNERNME1", "OWNERNME2","RESYRBLT"];
    findParams.outSpatialReference = map.spatialReference;

    dojo.connect(map, 'onLoad', function (theMap) {
        //resize the map when the browser resizes
        dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
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
        identifier: "PARCELID",  //This field needs to have unique values
        label: "PARCELID", //Name field for display. Not pertinent to a grid but may be used elsewhere.
        items: items
    };

    //Create data store and bind to grid.
    store = new dojo.data.ItemFileReadStore({ data: data });
    var grid = dijit.byId('grid');
    grid.setStore(store);

    //Zoom back to the initial map extent
    map.setExtent(startExtent);

}

//Zoom to the parcel when the user clicks a row
function onRowClickHandler(evt) {
    var clickedTaxLotId = grid.getItem(evt.rowIndex).PARCELID;
    var selectedTaxLot;

    dojo.forEach(map.graphics.graphics, function (graphic) {
        if ((graphic.attributes) && graphic.attributes.PARCELID === clickedTaxLotId) {
            selectedTaxLot = graphic;
            return;
        }
    });
    var taxLotExtent = selectedTaxLot.geometry.getExtent();
    map.setExtent(taxLotExtent);
}

dojo.addOnLoad(init);