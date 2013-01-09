dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.map");
dojo.require("esri.dijit.AttributeInspector-all");
dojo.require("esri.tasks.query");

var map, selected, updateFeature;

function init() {
    //This sample requires a proxy page to handle communications with the ArcGIS Server services. You will need to  
    //replace the url below with the location of a proxy on your machine. See the 'Using the proxy page' help topic
    //for details on setting up a proxy page.
    esri.config.defaults.io.proxyUrl = "proxy.ashx";

    var startExtent = new esri.geometry.Extent(-12827050.59, 3900275.81, -12353752.51, 4148237.53, new esri.SpatialReference({ wkid: 3857 }));
    map = new esri.Map("mapDiv", { extent: esri.geometry.Extent(startExtent) });

    dojo.connect(map, "onLoad", function () {
        //resize the map when the browser resizes
        dojo.connect(dijit.byId('mapDiv'), 'resize', map, map.resize);
    });


    dojo.connect(map, "onLayersAddResult", initSelectToolbar);

    //layers
    var tiledLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
    map.addLayer(tiledLayer);

    var petroFieldsMSL = new esri.layers.ArcGISDynamicMapServiceLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds6/MapServer");
    petroFieldsMSL.setDisableClientCaching(true);

    map.addLayer(petroFieldsMSL);

    var petroFieldsFL = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds6/FeatureServer/0", {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: ["FacilityID", "Name", "DateCreated", "DateLastEdited", "HTML"]
    });

    var selectionSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, new esri.symbol.SimpleLineSymbol("dashdot", new dojo.Color("yellow"), 2), null);
    petroFieldsFL.setSelectionSymbol(selectionSymbol);

    dojo.connect(petroFieldsFL, "onEditsComplete", function () {
        petroFieldsMSL.refresh();
    });

    map.addLayers([petroFieldsFL]);
}


function initSelectToolbar(results) {

    var petroFieldsFL = results[0].layer;
    var selectQuery = new esri.tasks.Query();
    selectQuery.returnGeometry = true;

    dojo.connect(map, "onClick", function (evt) {

        selectQuery.geometry = evt.mapPoint;

        petroFieldsFL.selectFeatures(selectQuery, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
            if (features.length > 0) {
                //store the current feature


                updateFeature = features[0];
                map.infoWindow.resize(300, 400);
                map.infoWindow.setTitle(features[0].getLayer().name);
                map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));

                map.graphics.remove(graphic);
                var graphic = features[0];
                map.graphics.add(graphic);
                graphicAttributes = graphic.attributes;
                cbx = graphicAttributes.HTML;

                form = new dijit.layout.ContentPane("");
                // dojo.empty(form.domNode);
                form = new dijit.layout.ContentPane({ content: graphic.attributes.HTML });
                dojo.place(form.domNode, attInspector.deleteBtn.domNode, "before");




            } else {
                map.infoWindow.hide();
            }
        });

    });


    //close info window
    dojo.connect(map.infoWindow, "onHide", function () { petroFieldsFL.clearSelection(); dojo.destroy(form.domNode); });

    //set field names up 

    var layerInfos = [{ 'featureLayer': petroFieldsFL,
        'showAttachments': false,
        'isEditable': true,
        'fieldInfos': [
       { 'fieldName': 'FacilityID', 'isEditable': false, 'label': 'Facility ID:' },
      { 'fieldName': 'Name', 'isEditable': false, 'label': 'Name:' },
       { 'fieldName': 'DateLastEdited', 'isEditable': true, 'label': 'Date Last Edited:' }

           ]
    }];



    attInspector = new esri.dijit.AttributeInspector({ layerInfos: layerInfos },
          dojo.create("div")
        );


    //add a save button next to the delete button



    var saveButton = new dijit.form.Button({ label: "Save", "class": "saveButton" });
    dojo.place(saveButton.domNode, attInspector.deleteBtn.domNode, "after");

    dojo.connect(saveButton, "onClick", function () {

        updateFeature.getLayer().applyEdits(null, [updateFeature], null);

        var press1_element = document.getElementById('SystemPressure1');
        var press2_element = document.getElementById('SystemPressure2');

        var press1 = press1_element.id;
        var press1n = press1_element.name;

        var press2 = press2_element.id;
        var press2n = press2_element.name;

        if (press1_element.checked) {
            var press1ck = 'checked';
        }
        else {
            var press1ck = '';
        }


        if (press2_element.checked) {
            var press2ck = 'checked';
        }
        else {
            var press2ck = '';
        }

        var cHTML = "<form><b>" + press1n + ":</b><input type='checkbox'  name='" + press1n + "' id='" + press1 + "' " + press1ck + "/>"
        + "<br> <b>" + press2n + ":</b><input type='checkbox'  name='" + press2n + "' id='" + press2 + "' " + press2ck + "/> </form>";

        updateFeature.attributes["HTML"] = cHTML;
        alert(cHTML);



    });

    dojo.connect(attInspector, "onAttributeChange", function (feature, fieldName, newFieldValue) {
        //store the updates to apply when the save button is clicked
        updateFeature.attributes[fieldName] = newFieldValue;

    });



    dojo.connect(attInspector, "onNext", function (feature) {
        updateFeature = feature;
        console.log("Next " + updateFeature.attributes.objectid);
    });


    dojo.connect(attInspector, "onDelete", function (feature) {
        feature.getLayer().applyEdits(null, null, [feature]);
        map.infoWindow.hide();
    });

    dojo.destroy(attInspector);

    map.infoWindow.resize(325, 210);
    map.infoWindow.setContent(attInspector.domNode);

}

dojo.addOnLoad(init);