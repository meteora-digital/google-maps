function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

import Cluster from '@google/markerclustererplus/dist/markerclustererplus.umd.js';
import { objectAssign } from '@meteora-digital/helpers';
var GoogleMaps = {}; // A little function to load the API

function load(key) {
  if (window.google === undefined && document.getElementById('GoogleMapsAPI') === null) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.id = "GoogleMapsAPI";
    script.src = "https://maps.googleapis.com/maps/api/js?key=".concat(key);
    document.getElementsByTagName("head")[0].appendChild(script);
  } else {
    console.log('Google Maps API has already been loaded. Aborting.');
  }
} // A radius function 


function rad(x) {
  return x * Math.PI / 180;
} // The render function will wait for google maps to load before firing. 


function render(func) {
  if (window.google) {
    GoogleMaps = objectAssign(GoogleMaps, window.google.maps);
    func();
  } else {
    setTimeout(function () {
      return render(func);
    }, 500);
  }
}

var Controller = /*#__PURE__*/function () {
  function Controller(el) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Controller);

    this.el = el;
    this.locations = options.locations;
    this.markers = [];
    this.info = []; // Here are the icon defaults

    this.iconDefaults = {
      path: 'M11.672 15.901c-2.734 0-4.952-2.174-4.952-4.857 0-2.682 2.218-4.859 4.952-4.859 2.735 0 4.953 2.177 4.953 4.86 0 2.682-2.218 4.856-4.953 4.856m0-15.9C5.453 0 .411 4.944.411 11.043c0 8.873 11.261 23.73 11.261 23.73s11.26-14.857 11.26-23.73c0-6.1-5.04-11.044-11.26-11.044',
      fillColor: '#ff3366',
      fillOpacity: 1,
      anchor: new GoogleMaps.Point(12, 36),
      strokeWeight: 0,
      scale: 1
    }; // Here are the defined default settings for the function

    this.settings = objectAssign({
      locations: [],
      markers: true,
      cluster: false,
      clusterSettings: {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
      },
      icon: this.iconDefaults,
      map: {
        disableDefaultUI: false,
        scrollwheel: false,
        zoomControl: true,
        zoom: 10
      }
    }, options); // If we have a center value in the options, use that value, otherwise use the middle of all locations.

    if (this.settings.map.center === undefined) this.settings.map.center = this.findCenter(); // Create new 

    this.map = new GoogleMaps.Map(this.el, this.settings.map); // Markers is a boolean, who knows, maybe we dont want any :)

    if (this.settings.markers) this.addMarkers();
  }

  _createClass(Controller, [{
    key: "addMarkers",
    value: function addMarkers() {
      var _this = this;

      this.locations.forEach(function (location, index) {
        // Here we are testing is the users has assigned a specifc icon for a location
        // For icon.anchor we want the user to insert an array [12, 36] rather than new GoogleMaps.Point(12,36);
        if (location.icon) {
          if (typeof location.icon !== 'string') {
            if (location.icon.anchor) location.icon.anchor = new GoogleMaps.Point(location.icon.anchor[0], location.icon.anchor[1]);
            location.icon = objectAssign({
              path: 'M11.672 15.901c-2.734 0-4.952-2.174-4.952-4.857 0-2.682 2.218-4.859 4.952-4.859 2.735 0 4.953 2.177 4.953 4.86 0 2.682-2.218 4.856-4.953 4.856m0-15.9C5.453 0 .411 4.944.411 11.043c0 8.873 11.261 23.73 11.261 23.73s11.26-14.857 11.26-23.73c0-6.1-5.04-11.044-11.26-11.044',
              fillColor: '#ff3366',
              fillOpacity: 1,
              anchor: new GoogleMaps.Point(12, 36),
              strokeWeight: 0,
              scale: 1
            }, location.icon);
          }
        } // We now set up the marker for each location


        var marker = new GoogleMaps.Marker({
          id: index,
          map: _this.map,
          position: location.position,
          icon: location.icon || _this.iconDefaults
        }); // Add a click handler that opens the infoWindow - if it exists.

        marker.addListener('click', function () {
          if (_this.info[index]) _this.info[index].open(_this.map, marker);

          _this.map.panTo(marker.position);
        }); // We store these markers in an array for filtering later on.

        _this.markers.push(marker);
      }); // If we wanna style the cluster icons but cbf writing the image url 5 times, we can inherit it like this :)

      this.settings.clusterSettings.styles.forEach(function (item, i) {
        if (item.url === undefined) item.url = "".concat(_this.settings.clusterSettings.imagePath + (i + 1), ".png");
      }); // this.settings.cluster is a boolean, but not for long

      if (this.settings.cluster) this.settings.cluster = new Cluster(this.map, this.markers, this.settings.clusterSettings);
    }
  }, {
    key: "filterMarkers",
    value: function filterMarkers() {
      var _this2 = this;

      var locationsArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.locations;
      var visibleMarkers = [];
      locationsArray.forEach(function (location) {
        _this2.markers.forEach(function (marker) {
          if (location.position.lat === marker.position.lat() && location.position.lng === marker.position.lng()) {
            marker.setMap(_this2.map);
            visibleMarkers.push(marker);
          } else {
            marker.setMap(null);
          }
        });
      }); // Center the map

      this.fitBounds(visibleMarkers);
      this.updateCluster(visibleMarkers);
    }
  }, {
    key: "showAllMarkers",
    value: function showAllMarkers() {
      var _this3 = this;

      this.markers.forEach(function (marker) {
        marker.setMap(_this3.map);
      });
      this.fitBounds();
      this.updateCluster(this.markers);
    }
  }, {
    key: "updateCluster",
    value: function updateCluster(locations) {
      if (this.settings.cluster) {
        this.settings.cluster.clearMarkers();
        this.settings.cluster.addMarkers(locations);
      }

      ;
    } // This function simply finds the average lat and lng so we can place the user in the middle of each of them

  }, {
    key: "findCenter",
    value: function findCenter() {
      var locationsArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.locations;
      var center = {
        lat: 0,
        lng: 0
      };
      locationsArray.forEach(function (location) {
        center.lat += location.position.lat;
        center.lng += location.position.lng;
      });
      return {
        lat: center.lat / locationsArray.length,
        lng: center.lng / locationsArray.length
      };
    } // This function will make it easier to fit all markers in the map

  }, {
    key: "fitBounds",
    value: function fitBounds() {
      var markersArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.markers;
      var bounds = new GoogleMaps.LatLngBounds();
      markersArray.forEach(function (marker) {
        return bounds.extend(marker.position);
      });
      this.map.fitBounds(bounds);
    } // This function will be used to insert a template for the infoWindows

  }, {
    key: "infoTemplate",
    value: function infoTemplate(func) {
      var _this4 = this;

      this.locations.forEach(function (location) {
        _this4.info.push(new GoogleMaps.InfoWindow({
          content: func(location)
        }));
      });
    }
  }, {
    key: "withUserLocation",
    value: function withUserLocation(func) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
          func({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        });
      } else {
        return false;
      }
    }
  }, {
    key: "findClosestTo",
    value: function findClosestTo(position) {
      if (position.lat && position.lng) {
        var radius = 6371; // radius of earth in km

        var distance = null;
        var closest = null;
        this.markers.forEach(function (marker) {
          var markerLat = marker.position.lat();
          var markerLng = marker.position.lng();
          var distanceLat = rad(markerLat - position.lat);
          var distanceLng = rad(markerLng - position.lng);
          var a = Math.sin(distanceLat / 2) * Math.sin(distanceLat / 2) + Math.cos(rad(position.lat)) * Math.cos(rad(position.lat)) * Math.sin(distanceLng / 2) * Math.sin(distanceLng / 2);
          var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          var d = radius * c;

          if (distance == null || d < distance) {
            distance = d;
            closest = marker;
          }

          ;
        });
        return closest;
      } else {
        console.log('argument needs to be a lat / lng object');
      }
    }
  }]);

  return Controller;
}();

GoogleMaps.Load = function () {
  var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return load(key);
}, GoogleMaps.Render = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return render(options);
}, GoogleMaps.Controller = function (el) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (window.google) {
    return new Controller(el, options);
  } else {
    console.log('A GoogleMaps Controller must be called after GoogleMaps.Load and should be within the Render function');
  }
};
export default GoogleMaps = GoogleMaps;