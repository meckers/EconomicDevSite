dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.map");
dojo.require("esri.dijit.AttributeInspector-all");


var map, updateFeature,form;

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

    var tiledLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
    map.addLayer(tiledLayer);


    var petroFieldsMSL = new esri.layers.ArcGISDynamicMapServiceLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds6/MapServer");
    petroFieldsMSL.setDisableClientCaching(true);

    map.addLayer(petroFieldsMSL);



    var petroFieldsFL = new esri.layers.FeatureLayer("http://phxfthmappdev01.gwfathom.net/ArcGIS/rest/services/Rounds/rounds6/FeatureServer/0", {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: ["FacilityID", "Name", "DateCreated", "DateLastEdited", "HTML","HTML2"]
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



    dojo.connect(map, "onClick", function (evt) {
        selectQuery.geometry = evt.mapPoint;
        petroFieldsFL.selectFeatures(selectQuery, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {
            if (features.length > 0) {
                var graphic = features[0];
                map.graphics.add(graphic);
                graphicAttributes = graphic.attributes;
                cbx = graphicAttributes.HTML;
               // alert(1);
                //alert(cbx);
                form = new dijit.layout.ContentPane({ content: cbx });
                dojo.place(form.domNode, attInspector.deleteBtn.domNode, "before");

            } else {
                map.infoWindow.hide();
                petroFieldsFL.clearSelection();

            }


            petroFieldsFL.selectFeatures(selectQuery, esri.layers.FeatureLayer.SELECTION_NEW, function (features) {

                if (features.length > 0) {

                    updateFeature = features[0];
                    //alert(2);
                    map.infoWindow.setTitle(features[0].getLayer().name);
                    map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
                    map.infoWindow.resize(300, 400);

                } else {
                    map.infoWindow.hide();
                    petroFieldsFL.clearSelection();

                }

            });
        
        });


    });





    dojo.connect(map.infoWindow, "onHide", function () {
        petroFieldsFL.clearSelection();
        if (form != null)
            {
             dojo.destroy(form.domNode);
             };
    
             });




    var layerInfos = [{ 'featureLayer': petroFieldsFL,
        'showAttachments': false,
        'isEditable': true,
        'fieldInfos': [
       { 'fieldName': 'FacilityID', 'isEditable': false, 'label': 'Facility ID:' },
      { 'fieldName': 'Name', 'isEditable': true, 'label': 'Name:' }
      
           ]
    }];



    var attInspector = new esri.dijit.AttributeInspector({
        layerInfos: layerInfos
    },
          dojo.create("div")
        );



    //add a save button next to the delete button
    var saveButton = new dijit.form.Button({ label: "Save", "class": "saveButton" });
    dojo.place(saveButton.domNode, attInspector.deleteBtn.domNode, "after");



    dojo.connect(saveButton, "onClick", function () {
        updateFeature.getLayer().applyEdits(null, [updateFeature], null);
    });

    dojo.connect(saveButton, "onClick", function () {
        updateFeature.getLayer().applyEdits(null, [updateFeature], null);
        alert('Success!');
       });


    dojo.connect(attInspector, "onAttributeChange", function (feature, fieldName, newFieldValue) {

        updateFeature.attributes[fieldName] = newFieldValue;

    });

   dojo.connect(attInspector, "onAttributeChange", function (feature, fieldName, newFieldValue) {

           var press1_element = document.getElementById('SystemPressure1');
           var press2_element = document.getElementById('SystemPressure2');
           var Activity_element = document.getElementById('Activity');
           var StorageTan_element = document.getElementById('StorageTankLevel1');
           var StorageT_1_element = document.getElementById('StorageTankLevel2');
           var FreeClResi_element = document.getElementById('FreeClResidual1');
           var FreeClRe_1_element = document.getElementById('FreeClResidual2');
           var SystemPres_element = document.getElementById('DistributionMeter1');

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

       });


       dojo.connect(attInspector, "onAttributeChange", function (feature, fieldName, newFieldValue) {

           var press1_element = document.getElementById('SystemPressure1');
           var press2_element = document.getElementById('SystemPressure2');



           if (press1_element.checked) {
               var press1t = "text";
           }
           else {
               var press1t = 'hidden';
           }

           if (press1_element.checked) {
               var press1 = press1_element.id;
           }
           else {
               var press1 = '';
           }

           if (press1_element.checked) {
               var press1n = press1_element.name;
           }
           else {
               var press1n = '';
           }

           if (press2_element.checked) {
               var press2t = "text";
           }
           else {
               var press2t = 'hidden';
           }
           if (press2_element.checked) {
               var press2 = press2_element.id;
           }
           else {
               var press2 = '';
           }

           if (press2_element.checked) {
               var press2n = press2_element.name;
           }
           else {
               var press2n = '';
           }

           var fHTML = "<form><b>" + press1n + " <input type='" + press1t + "' size = '4' Name='" + press1n + "' id='" + press1 + "'/>" + "<br><b>" + press2n + " <input type='" + press2t + "' size = '4' Name='" + press2n + "' id='" + press2 + "'/> </form>";

           

           updateFeature.attributes["HTML2"] = fHTML;

          // alert(fHTML);

       });
    



    dojo.connect(attInspector, "onNext", function (feature) {
        updateFeature = feature;
        console.log("Next " + updateFeature.attributes.objectid);
    });


    dojo.connect(attInspector, "onDelete", function (feature) {
        feature.getLayer().applyEdits(null, null, [feature]);
        map.infoWindow.hide();
    });



    map.infoWindow.setContent(attInspector.domNode);


}

dojo.addOnLoad(init);









