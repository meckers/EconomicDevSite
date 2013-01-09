dojo.declare("esri.ux.layers.ClusterLayer",esri.layers.GraphicsLayer,{constructor:function(a){this.displayOnPan=a.displayOnPan||false;this._map=a.map;dojo.connect(this._map,"onZoomStart",dojo.hitch(this,this.handleMapZoomStart));dojo.connect(this._map,"onExtentChange",dojo.hitch(this,this.handleMapExtentChange));this.spatialReference=new esri.SpatialReference({wkid:102100});this.initialExtent=this.fullExtent=new esri.geometry.Extent(-20037507.0671618,-19971868.8804086,20037507.0671618,19971868.8804086,this.spatialReference);this.levelPointTileSpace=[];this._features=[];try{this.setFeatures(a.features)}catch(b){alert(b)}dojo.connect(this,"onLoad",this.handleLayerLoaded);dojo.connect(this,"onMouseOver",this.handleMouseOver);dojo.connect(this,"onMouseOut",this.handleMouseOut);this.symbolBank={single:new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE,10,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([0,0,0,1]),1),new dojo.Color([255,215,0,1])),less16:new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE,20,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([0,0,0,1]),1),new dojo.Color([255,215,0,1])),less30:new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE,30,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_NULL,new dojo.Color([0,0,0,0]),1),new dojo.Color([100,149,237,.85])),less50:new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE,30,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_NULL,new dojo.Color([0,0,0,0]),1),new dojo.Color([65,105,225,.85])),over50:new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE,45,new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_NULL,new dojo.Color([0,0,0]),0),new dojo.Color([255,69,0,.65]))};this._flareDistanceFromCenter=a.flareDistanceFromCenter||20;this._flareLimit=a.flareLimit||20;this._infoTemplate=a.infoWindow.template||null;this._infoWindowWidth=a.infoWindow.width||150;this._infoWindowHeight=a.infoWindow.height||100;this.loaded=true;this.onLoad(this)},handleMapZoomStart:function(){this.clear()},handleMapExtentChange:function(){this.clusterFeatures()},setFeatures:function(b){this._features=[];var a=b[0].geometry.spatialReference.wkid;if(a!=102100)if(a==4326||a==4269||a==4267)dojo.forEach(b,function(a){point=esri.geometry.geographicToWebMercator(a.geometry);point.attributes=a.attributes;this._features.push(point)},this);else{throw"Input Spatial Reference Must Be in Either WKID: 102110 or WKID: 4326";return}else dojo.forEach(b,function(a){point=a.geometry;point.attributes=a.attributes;this._features.push(point)},this)},handleLayerLoaded:function(){this.clusterFeatures()},handleMouseOver:function(r){var a=r.graphic;if(a.symbol.type=="textsymbol"||a.symbol.type=="simplelinesymbol"){if(a.attributes)a.attributes.baseGraphic&&a.attributes.baseGraphic.task&&a.attributes.baseGraphic.task.cancel();return}if(a.attributes.isCluster){if(a.attributes.clustered){a.task&&a.task.cancel();return}}else{a.attributes.baseGraphic&&a.attributes.baseGraphic.task.cancel();this.showInfoWindow(a);return}a.clusterGraphics=[];var o=a.attributes.clusterSize,l=new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,new dojo.Color([0,0,0,1]),1),c=new esri.geometry.Polyline(map.spatialReference);c.addPath([a.geometry,new esri.geometry.Point(0,0)]);var j=new esri.Graphic(c,l);if(o>1&&o<=this._flareLimit){for(var d=a.attributes.clusterSize,h=this.getPixelDistanceFromCenter(a.geometry),i=a.geometry,n,k,p,q,e,m,g,f,b=0;b<d;b++){n=Math.sin(Math.PI*2*(b/d));k=Math.cos(Math.PI*2*(b/d));p=i.x+h*k;q=i.y+h*n;e=new esri.geometry.Point(p,q,this._map.spatialReference);m=new esri.Graphic(e,this.symbolBank.single,dojo.mixin(a.attributes[b],{baseGraphic:a}),this._infoTemplate);g=this.add(m);g.getDojoShape().moveToFront();c.setPoint(0,1,e);j=new esri.Graphic(c,l,{baseGraphic:a});f=this.add(j);f.getDojoShape().moveToBack();a.clusterGraphics.push(g);a.clusterGraphics.push(f)}a.attributes.clustered=true}},getPixelDistanceFromCenter:function(b){var c=this._flareDistanceFromCenter,a=esri.geometry.toScreenGeometry(this._map.extent,this._map.width,this._map.height,b);a.x=a.x+c;a.y=a.y+c;var d=esri.geometry.toMapGeometry(this._map.extent,this._map.width,this._map.height,a),e=esri.geometry.getLength(b,d);return e},handleMouseOut:function(c){var a=c.graphic,b;if(a.symbol.type=="textsymbol")return;if(a.attributes.isCluster){b=new DelayedTask(function(a){this.removeFlareGraphics(a.clusterGraphics);delete a.clusterGraphics;a.attributes.clustered=false},this,[a]);b.delay(800);a.task=b}else{if(a.attributes.baseGraphic){b=new DelayedTask(function(a){this.removeFlareGraphics(a.attributes.baseGraphic.clusterGraphics);delete a.attributes.baseGraphic.clusterGraphics;a.attributes.baseGraphic.attributes.clustered=false},this,[a]);b.delay(800);a.attributes.baseGraphic.task=b}map.infoWindow.isShowing&&map.infoWindow.hide()}},removeFlareGraphics:function(a){if(a&&a.length)for(var b=0;b<a.length;b++)this.remove(a[b])},showInfoWindow:function(a){map.infoWindow.isShowing&&map.infoWindow.hide();map.infoWindow.setContent(a.getContent());map.infoWindow.setTitle(a.getTitle());map.infoWindow.resize(this._infoWindowWidth,this._infoWindowHeight);var b=esri.geometry.toScreenGeometry(this._map.extent,this._map.width,this._map.height,a.geometry);map.infoWindow.show(b,map.getInfoWindowAnchor(b))},clusterFeatures:function(r){this.clear();var a=dojox.lang.functional,i=this._map,f=this._map.getLevel()+2,e=this._map.extent,d=i.getLayer(i.layerIds[0]).tileInfo,l=a.lambda("point, tileWidth,tileHeight,oPoint -> [Math.floor((oPoint.y - point.y)/tileHeight),Math.floor((point.x-oPoint.x)/tileWidth), point]"),g=d.lods[f].resolution,s=g*d.width,q=g*d.height,h=a.partial(l,a.arg,s,q,d.origin),b=a.map([new esri.geometry.Point(e.xmin,e.ymin),new esri.geometry.Point(e.xmax,e.ymax)],h),p=b[1][0],n=b[0][0],o=b[0][1],m=b[1][1];if(!this.levelPointTileSpace[f]||r){var k=a.map(this._features,h),c=[];dojo.forEach(k,function(a){if(c[a[0]]){var b=c[a[0]];if(b[a[1]])b[a[1]].push(a[2]);else{b[a[1]]=a[1];b[a[1]]=[a[2]]}}else{var b=c[a[0]]=[];b[a[1]]=a[1];b[a[1]]=[a[2]]}});this.levelPointTileSpace[f]=c}var j=a.lambda("cPt,nextPt->{x:(cPt.x+nextPt.x)/2,y:(cPt.y+nextPt.y)/2}");dojo.forEach(this.levelPointTileSpace[f],function(c,b){b>=p&b<=n&&dojo.forEach(c,function(b,e){if(b)if(e>=o&e<=m){var h=[];if(b.length>2){var d=a.reduce(b,j),c;if(b.length<=15)c=this.symbolBank.less16;else if(b.length>15&&b.length<=30)c=this.symbolBank.less30;else if(b.length>30&&b.length<=50)c=this.symbolBank.less50;else c=this.symbolBank.over50;var g=dojo.map(b,function(a){return a.attributes}),f=dojo.mixin(g,{isCluster:true,clusterSize:b.length});this.add(new esri.Graphic(new esri.geometry.Point(d.x,d.y),c,f));this.add(new esri.Graphic(new esri.geometry.Point(d.x,d.y),(new esri.symbol.TextSymbol(b.length)).setOffset(0,-5)))}else dojo.forEach(b,function(a){this.add(new esri.Graphic(a,this.symbolBank.single,dojo.mixin(a.attributes,{isCluster:false}),this._infoTemplate))},this)}},this)},this)}})