dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.map");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.dijit.editing.TemplatePicker");

var widget, selected;
var map;

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
   // dojo.connect(map, "onExtentChange", showExtent);

    var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
    var incidentLayer = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds_admin/FeatureServer/0", {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"],
        id: "incidentLayer"
    });

    incidentLayer.setSelectionSymbol(new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color("red")));
    map.addLayers([basemap, incidentLayer]);


    esri.setRequestPreCallback(function (ioArgs) {
        if (ioArgs.url.indexOf('queryRelatedRecords') !== -1) {
            ioArgs.url = ioArgs.url.replace("FeatureServer", "MapServer");
        }
        return ioArgs;
    });
}

function initEditing(layers) {
    map = this;
    map.infoWindow.resize(300, 210);
    var incidentLayer = map.getLayer("incidentLayer");
    
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
       // html2 = graphicAttributes.HTML2;
       
        content = "<b>Facility Name: </b>" + graphicAttributes.Name
                  + "<br><b>FacilityID: </b>" + graphicAttributes.FacilityID
                  + "<br><b>Date Edited: </b>" + (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear()
                  + "<br> -------------<br>"
                 // + html


        relatedQuery.objectIds = [graphicAttributes.OBJECTID];
        incidentLayer.queryRelatedFeatures(relatedQuery, function (relatedRecords) {
            var fset = relatedRecords[graphicAttributes.OBJECTID];
            var count = (fset) ? fset.features.length : 0;

            content = content +
            "<br><br><img style='cursor:pointer' src='http://www.jmautomotive.com/Dealer-Websites/J+Mautomotive/images/submit-button.jpg' onclick='javascript:voteOnIncident(" + graphicAttributes.ObjectID + ");'>";

            map.infoWindow.setTitle(title);
            map.infoWindow.setContent(content);
            map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
        });
    });



}



function voteOnIncident(FacilityID) {



   // alert(press1);
  
    var voteRecord = { attributes: {
        FacilityID:FacilityID
       
        } 
        };


var incidentVoteTable = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds_admin/FeatureServer/1");
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