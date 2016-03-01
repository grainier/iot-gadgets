/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var pm = pm || {};
pm.util = pm.util || {};
pm.layers = pm.layers || {};
pm.cluster_groups = pm.cluster_groups || {};
pm.markers = pm.markers || {};
pm.map = null;
pm.polling_task = null;
pm.selected_marker = null;
pm.toggled = false;
pm.freeze = false;

pm.initialize = function () {
    this.initLayers();
    this.initMap();
    this.startPolling();
};

pm.initLayers = function () {
    // Add default layer.
    pm.layers["default"] = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '© <a href="http://www.openstreetmap.org/copyright" target="_blank">' +
        'OpenStreetMap</a>'
    });

    // Add other layers from config.
    for (var i = 0; i < config.sources.length; i++) {
        var source = config.sources[i];
        pm.cluster_groups[source.id] = new L.MarkerClusterGroup(config.markercluster);

        pm.cluster_groups[source.id].on('clustermouseover', function (a) {
            pm.freeze = true;
        });

        pm.cluster_groups[source.id].on('clustermouseout', function (a) {
            pm.freeze = false;
        });
    }
};

pm.initMap = function () {
    if (pm.map != null && typeof(pm.map) !== 'undefined') {
        pm.map.remove();
    }
    pm.map = L.map("map", {
        zoom: config.map.zoom,
        center: config.map.center,
        layers: this.getLayers(),
        zoomControl: false,
        attributionControl: config.map.attributionControl,
        maxZoom: config.map.maxZoom,
        maxNativeZoom: config.map.maxNativeZoom
    });
    L.control.layers(null, pm.cluster_groups).addTo(pm.map);        // Add layer controller
    new L.Control.Zoom({position: 'bottomright'}).addTo(pm.map);    // Add zoom controller
    for (var i in this.cluster_groups) {                            // Add sub marker groups
        if (this.cluster_groups.hasOwnProperty(i)) {
            this.cluster_groups[i].addTo(this.map);
        }
    }

    // Click callbacks.
    pm.map.on('click', function (e) {
        pm.clearFocus();
    });

    // Zoom callbacks.
    pm.map.on('zoomend', function () {
        if (pm.map.getZoom() < 14) {
            console.log("Zoom is less than 14");
        } else {
            console.log("Zoom is greater than 14");
        }
    });
};

pm.getLayers = function () {
    var layers = [];
    for (var i in this.layers) {
        if (this.layers.hasOwnProperty(i)) {
            layers.push(this.layers[i]);
        }
    }
    return layers;
};

pm.startPolling = function () {
    //this.polling_task = setInterval(function () {
    //    if (!pm.freeze) {
    //        for (var i = 0; i < config.sources.length; i++) {
    //            pm.poll(config.sources[i]);
    //        }
    //    }
    //}, config.constants.POLLING_INTERVAL);
    pm.poll();
};

//pm.poll = function (source) {
//    $.getJSON(source.url, function (data) {
//        $.each(data, function (key, val) {
//            pm.processPointMessage({
//                "id": val.ID,
//                "sourceId": source.id,
//                "type": "Feature",
//                "properties": {
//                    "name": val.NAME,
//                    "state": "",
//                    "information": "",
//                    "speed": 0.0,
//                    "heading": 0.0
//                },
//                "geometry": {
//                    "type": "Point",
//                    "coordinates": [val.LONGITUDE, val.LATITUDE]
//                }
//            });
//        });
//    });
//};

function StubMarker(seed) {
    this.ids = ["Device_01", "Device_02", "Device_03", "Device_04", "Device_05", "Device_06", "Device_07", "Device_08", "Device_09"];
    this.layers = ["Category 1", "Category 2"];
    this.source = this.layers[seed % 2];
    this.move = seed % 2 == 0;
    this.lng = -0.09029;
    this.lat = 51.51318;
    this.id = this.ids[seed % 9];
    return this;
}
StubMarker.prototype.update = function () {
    if (this.move) {
        var rand = Math.floor(Math.random() * (4 - 1 + 1)) + 1;
        switch (rand) {
            case 1:
                this.lng += 0.00003 * rand;
                this.lat += 0.00003 * rand;
                break;
            case 2:
                this.lng -= 0.00002 * rand;
                this.lat -= 0.00002 * rand;
                break;
            case 3:
                this.lng += 0.00001 * rand;
                this.lat -= 0.00001 * rand;
                break;
            case 4:
                this.lng -= 0.00004 * rand;
                this.lat += 0.00004 * rand;
                break;
        }
    }
    return {
        "id": this.id,
        "sourceId": this.source,
        "type": "Feature",
        "properties": {
            "name": this.id,
            "state": "",
            "information": "Device Information",
            "speed": 0.0,
            "heading": 0.0
        },
        "geometry": {
            "type": "Point",
            "coordinates": [this.lng, this.lat]
        }
    };
};


// TODO : Replace this stub with real data.
pm.markers = [
    new StubMarker(1),
    new StubMarker(2),
    new StubMarker(3),
    new StubMarker(4),
    new StubMarker(5),
    new StubMarker(6),
    new StubMarker(7),
    new StubMarker(8),
    new StubMarker(9)
];
pm.poll = function () {
    setInterval(function () {
        for (var i = 0; i < pm.markers.length; i++) {
            if (!pm.freeze) {
                pm.processPointMessage(pm.markers[i].update());
            }
        }
    }, 2000);
};

pm.processPointMessage = function (geoJson) {
    if (geoJson.id in pm.markers) {
        var existingObject = pm.markers[geoJson.id];
        existingObject.update(geoJson);
    } else {
        var receivedObject = new GeoMarker(geoJson, pm.cluster_groups[geoJson.sourceId]);
        receivedObject.update(geoJson);
        pm.markers[geoJson.id] = receivedObject;
        pm.markers[geoJson.id].addToLayer();
    }
};

pm.focusOnMarker = function (markerId) {
    var spatialObject = pm.markers[markerId];
    if (!spatialObject) {
        console.log("marker with id : " + markerId + " not in map");
        return false;
    }
    pm.clearFocus();
    pm.selected_marker = markerId;
    console.log("Selected " + markerId + " type " + spatialObject.type);
    pm.map.setView(spatialObject.marker.getLatLng(), 15, {animate: true}); // TODO: check the map._layersMaxZoom and set the zoom level accordingly

    $('#objectInfo').find('#objectInfoId').html(pm.selected_marker);
    spatialObject.marker.openPopup();
    if (!pm.toggled) {
        $('#objectInfo').animate({width: 'toggle'}, 100);
        pm.toggled = true;
    }
    spatialObject.drawPath();
};

pm.clearFocus = function () {
    if (this.selected_marker) {
        var spatialObject = pm.markers[pm.selected_marker];
        spatialObject.removeFromMap();
        this.selected_marker = null;
    }
};

pm.util.getModuleBase = function () {
    if (window.__moduleBase) return window.__moduleBase;
    if (_args) {
        var moduleBase = _args()['url'];
        moduleBase = moduleBase.substring(0, moduleBase.lastIndexOf('/') + 1);
        window.__moduleBase = moduleBase;
        return window.__moduleBase;
    }
    console.error('Can not find module base. Gadget may not work properly.');
    return '';
};

pm.util.rebaseRelativeUrl = function (relativeUrl, cached) {
    var moduleBase = pm.util.getModuleBase();
    var absUrl = moduleBase + relativeUrl;
    if (cached && _IG_GetCachedUrl) {
        absUrl = _IG_GetCachedUrl(absUrl);
    }
    return absUrl;
};

$(document).ready(function () {
    pm.initialize();
});

$(window).on('beforeunload', function () {
    if (pm.polling_task != null) {
        clearInterval(pm.polling_task);
    }
});