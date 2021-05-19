"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _markerclustererplus = _interopRequireDefault(require("@googlemaps/markerclustererplus"));

var _meteora = require("meteora");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

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
    GoogleMaps = (0, _meteora.objectAssign)(GoogleMaps, window.google.maps);
    func();
  } else {
    setTimeout(function () {
      return render(func);
    }, 500);
  }
}

var Controller = /*#__PURE__*/function () {
  function Controller(el) {
    var _this = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Controller);

    this.el = el;
    this.locations = [];
    this.info = []; // Here are the defined default settings for the function

    this.settings = (0, _meteora.objectAssign)({
      locations: [],
      markers: true,
      cluster: false,
      clusterSettings: {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
      },
      icon: {
        path: 'M11.672 15.901c-2.734 0-4.952-2.174-4.952-4.857 0-2.682 2.218-4.859 4.952-4.859 2.735 0 4.953 2.177 4.953 4.86 0 2.682-2.218 4.856-4.953 4.856m0-15.9C5.453 0 .411 4.944.411 11.043c0 8.873 11.261 23.73 11.261 23.73s11.26-14.857 11.26-23.73c0-6.1-5.04-11.044-11.26-11.044',
        fillColor: '#ff3366',
        fillOpacity: 1,
        anchor: new GoogleMaps.Point(12, 36),
        strokeWeight: 0,
        scale: 1
      },
      map: {
        disableDefaultUI: false,
        scrollwheel: false,
        zoomControl: true,
        zoom: 10
      }
    }, options); // Create new 

    this.map = new GoogleMaps.Map(this.el, this.settings.map); // Markers is a boolean, who knows, maybe we dont want any :)

    if (this.settings.markers) {
      options.locations.forEach(function (location) {
        return _this.locations.push({
          data: location
        });
      }); // Add the markers to the map

      this.addMarkers();
    }

    ;
  }

  _createClass(Controller, [{
    key: "addMarkers",
    value: function addMarkers() {
      var _this2 = this;

      this.locations.forEach(function (location, index) {
        // Here we are testing is the users has assigned a specifc icon for a location
        // For icon.anchor we want the user to insert an array [12, 36] rather than new GoogleMaps.Point(12,36);
        if (location.data.icon) {
          if (typeof location.data.icon !== 'string') {
            if (location.data.icon.anchor) location.data.icon.anchor = new GoogleMaps.Point(location.data.icon.anchor[0], location.data.icon.anchor[1]);
            location.data.icon = (0, _meteora.objectAssign)(_this2.settings.icon, location.data.icon);
          }
        } // We now set up the marker for each location


        location.marker = new GoogleMaps.Marker({
          id: index,
          map: _this2.map,
          position: location.data.position,
          icon: location.data.icon || _this2.settings.icon
        }); // Add a click handler that opens the infoWindow - if it exists.

        location.marker.addListener('click', function () {
          // Pan to the marker position
          _this2.map.panTo(location.marker.position); // loop the other items and close the info windows


          _this2.locations.filter(function (item) {
            return item != location;
          }).forEach(function (item) {
            if (item.info != undefined) item.info.close();
          }); // Open this info window


          if (location.info != undefined) location.info.open();
        }); // We store these markers in an array for later on.
        // this.markers.push(location.marker);
      }); // If we wanna style the cluster icons but cbf writing the image url 5 times, we can inherit it like this :)

      if (this.settings.clusterSettings.styles !== undefined) {
        this.settings.clusterSettings.styles.forEach(function (item, i) {
          if (item.url === undefined) item.url = "".concat(_this2.settings.clusterSettings.imagePath + (i + 1), ".png");
        });
      } // this.settings.cluster is a boolean, but not for long


      if (this.settings.cluster) {
        // Create an empty array to hold the markers
        var markers = []; // Put all the locations markers in the array

        this.locations.forEach(function (location) {
          return markers.push(location.marker);
        }); // Add marker clustering

        this.settings.cluster = new _markerclustererplus["default"](this.map, markers, this.settings.clusterSettings);
      }

      ;
    }
  }, {
    key: "filterMarkers",
    value: function filterMarkers() {
      var _this3 = this;

      var locations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.locations;
      this.locations.forEach(function (location) {
        if (location.marker) location.marker.setMap(locations.indexOf(location) > -1 ? _this3.map : null);
      });
      this.updateCluster(locations);
      this.fitBounds(locations);
    }
  }, {
    key: "showAllMarkers",
    value: function showAllMarkers() {
      this.filterMarkers();
    }
  }, {
    key: "updateCluster",
    value: function updateCluster() {
      var locations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.locations;
      // an empty array to store the markers
      var markers = []; // If we have clustering set up

      if (this.settings.cluster) {
        // Clear all the clusters
        this.settings.cluster.clearMarkers(); // For each locations add the location.marker to the new markers array

        locations.forEach(function (location) {
          return markers.push(location.marker);
        }); // Add markers to the cluster settings

        this.settings.cluster.addMarkers(markers);
      }

      ;
    } // This function will make it easier to fit all markers in the map

  }, {
    key: "fitBounds",
    value: function fitBounds() {
      var locations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.locations;
      // Create a new GoogleMaps.LatLngBounds() object
      var boundary = new GoogleMaps.LatLngBounds(); // Add each location position to the boundary

      locations.forEach(function (location) {
        console.log(location);
        boundary.extend(location.data.position);
      }); // Tell the map to zoom to the boundary

      this.map.fitBounds(boundary);
    } // This function will be used to insert a template for the infoWindows

  }, {
    key: "infoTemplate",
    value: function infoTemplate(func) {
      this.locations.forEach(function (location) {
        location.info = new GoogleMaps.InfoWindow({
          content: func(location.data)
        });
      });
    } // This function will get the user's geolocation, and then pass that into the function argument

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
    } // This function takes an object with a lat and lng value and returns the closest marker from the map.locations array.

  }, {
    key: "findClosestTo",
    value: function findClosestTo(position) {
      var locations = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.locations;

      if (position.lat && position.lng) {
        var closest = null;
        var radius = 6371; // radius of earth in km

        var calc = {};
        var distance = {
          smallest: null,
          current: null
        };
        locations.forEach(function (location) {
          distance.lat = rad(location.data.position.lat - position.lat);
          distance.lng = rad(location.data.position.lng - position.lng);
          calc.a = Math.sin(distance.lat / 2) * Math.sin(distance.lat / 2) + Math.cos(rad(position.lat)) * Math.cos(rad(position.lat)) * Math.sin(distance.lng / 2) * Math.sin(distance.lng / 2);
          calc.c = 2 * Math.atan2(Math.sqrt(calc.a), Math.sqrt(1 - calc.a));
          distance.current = radius * calc.c;

          if (distance.smallest == null || distance.current < distance.smallest) {
            distance.smallest = distance.current;
            closest = location;
          }

          ;
        });
        return closest;
      } else {
        console.log('argument needs to be a lat / lng object');
      }
    }
  }, {
    key: "search",
    value: function search() {
      var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var locations = [];
      var include = true;

      var match = function match(key1, key2) {
        return key1.toString().toLowerCase().indexOf(key2.toString().toLowerCase()) > -1;
      }; // If we have any filters to look at


      if (Object.keys(filter).length) {
        // Loop each location
        this.locations.forEach(function (location) {
          // Set this location up to be included
          include = true; // Loop through the filters

          for (var key in filter) {
            // If the location has data related to the filter
            if (location.data[key]) {
              // Check if the value is an array
              if (Array.isArray(filter[key])) {
                // Loop the filter value array
                for (var i = 0; i < filter[key].length; i++) {
                  // If the value doesn't match anything from the location data then dont include it and exit the loop
                  // If the data doesnt match, dont include it and exit the loop
                  if (!match(location.data[key], filter[key][i])) {
                    include = false;
                    break;
                  }

                  ;
                }
              } else {
                // If it isnt an array, check that it is in the location data and exit the loop
                if (!match(location.data[key], filter[key])) include = false;
                break;
              }
            } else {
              // If the location doesnt have any data that matches the filter dont include it and exit the loop
              include = false;
              break;
            }
          } // If our location made it to here, then we include it!


          if (include) locations.push(location);
        }); // Next return our filtered locations

        return locations.length ? locations : [];
      } // If there was never anything to filter then return everything


      return this.locations;
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

var _default = GoogleMaps = GoogleMaps;

exports["default"] = _default;