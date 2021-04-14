// import Cluster from '@googlemaps/markerclustererplus/dist/markerclustererplus.umd.js';
import MarkerClusterer from '@googlemaps/markerclustererplus';
import {objectAssign} from '@meteora-digital/helpers';

let GoogleMaps = {};

// A little function to load the API
function load(key) {
  if (window.google === undefined && document.getElementById('GoogleMapsAPI') === null) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.id = "GoogleMapsAPI";

    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    document.getElementsByTagName("head")[0].appendChild(script);
  }else {
    console.log('Google Maps API has already been loaded. Aborting.');
  }
}

// A radius function 
function rad(x) {
  return x * Math.PI / 180;
}

// The render function will wait for google maps to load before firing. 
function render(func) {
  if (window.google) {
    GoogleMaps = objectAssign(GoogleMaps, window.google.maps);
    func();
  }else {
    setTimeout(() => render(func), 500);
  }
}

class Controller {
  constructor(el, options = {}) {
    this.el = el;
    this.locations = options.locations;
    this.markers = [];
    this.info = [];

    // Here are the icon defaults
    this.iconDefaults = {
      path: 'M11.672 15.901c-2.734 0-4.952-2.174-4.952-4.857 0-2.682 2.218-4.859 4.952-4.859 2.735 0 4.953 2.177 4.953 4.86 0 2.682-2.218 4.856-4.953 4.856m0-15.9C5.453 0 .411 4.944.411 11.043c0 8.873 11.261 23.73 11.261 23.73s11.26-14.857 11.26-23.73c0-6.1-5.04-11.044-11.26-11.044',
      fillColor: '#ff3366',
      fillOpacity: 1,
      anchor: new GoogleMaps.Point(12,36),
      strokeWeight: 0,
      scale: 1,
    }

    // Here are the defined default settings for the function
    this.settings = objectAssign({
      locations: [],
      markers: true,
      cluster: false,
      clusterSettings: {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
      },
      icon: this.iconDefaults,
      map: {
        disableDefaultUI: false,
        scrollwheel: false,
        zoomControl: true,
        zoom: 10,
      },
    }, options);

    // Create new 
    this.map = new GoogleMaps.Map(this.el, this.settings.map);

    // If we have a center value in the options, use that value, otherwise use the middle of all locations.
    if (this.settings.map.center === undefined) this.fitBounds();

    // Markers is a boolean, who knows, maybe we dont want any :)
    if (this.settings.markers) this.addMarkers();
  }

  addMarkers() {
    this.locations.forEach((location, index) => {
      // Here we are testing is the users has assigned a specifc icon for a location
      // For icon.anchor we want the user to insert an array [12, 36] rather than new GoogleMaps.Point(12,36);
      if (location.icon) {
        if (typeof location.icon !== 'string') {
          if (location.icon.anchor) location.icon.anchor = new GoogleMaps.Point(location.icon.anchor[0], location.icon.anchor[1]);
          location.icon = objectAssign({
            path: 'M11.672 15.901c-2.734 0-4.952-2.174-4.952-4.857 0-2.682 2.218-4.859 4.952-4.859 2.735 0 4.953 2.177 4.953 4.86 0 2.682-2.218 4.856-4.953 4.856m0-15.9C5.453 0 .411 4.944.411 11.043c0 8.873 11.261 23.73 11.261 23.73s11.26-14.857 11.26-23.73c0-6.1-5.04-11.044-11.26-11.044',
            fillColor: '#ff3366',
            fillOpacity: 1,
            anchor: new GoogleMaps.Point(12,36),
            strokeWeight: 0,
            scale: 1,
          }, location.icon);
        }
      }

      // We now set up the marker for each location
      let marker = new GoogleMaps.Marker({
        id: index,
        map: this.map,
        position: location.position,
        icon: location.icon || this.settings.icon,
      });

      // Add a click handler that opens the infoWindow - if it exists.
      marker.addListener('click', () => {
        if (this.info.length) {
          this.info.filter((item) => item !== this.info[index]).forEach((infoWindow) => infoWindow.close());
        }
        if (this.info[index]) this.info[index].open(this.map, marker);
        this.map.panTo(marker.position);
      });

      // We store these markers in an array for filtering later on.
      this.markers.push(marker);
    });

    // If we wanna style the cluster icons but cbf writing the image url 5 times, we can inherit it like this :)
    if (this.settings.clusterSettings.styles !== undefined) {
      this.settings.clusterSettings.styles.forEach((item, i) => {
        if (item.url === undefined) item.url = `${this.settings.clusterSettings.imagePath + (i + 1)}.png`;
      });
    }

    // this.settings.cluster is a boolean, but not for long
    if (this.settings.cluster) this.settings.cluster = new MarkerClusterer(this.map, this.markers, this.settings.clusterSettings);
  }

  filterMarkers(locationsArray = this.locations) {
    let visibleMarkers = [];

    locationsArray.forEach((location) => {
      this.markers.forEach((marker) => {
        if (location.position.lat === marker.position.lat() && location.position.lng === marker.position.lng()) {
          marker.setMap(this.map);
          visibleMarkers.push(marker);
        }else {
          marker.setMap(null);
        }
      });
    });

    // Center the map
    this.updateCluster(visibleMarkers);
    this.fitBounds(visibleMarkers);
  }

  showAllMarkers() {
    this.filterMarkers();
  }

  updateCluster(locationsArray = this.markers) {
    if (this.settings.cluster) {
      this.settings.cluster.clearMarkers();
      this.settings.cluster.addMarkers(locationsArray);
    };
  }

  // This function will make it easier to fit all markers in the map
  fitBounds(markersArray = this.markers) {
    const bounds = new GoogleMaps.LatLngBounds();

    markersArray.forEach((marker) => bounds.extend(marker.position));

    this.map.fitBounds(bounds);
  }

  // This function will be used to insert a template for the infoWindows
  infoTemplate(func) {
    this.locations.forEach((location) => {
      this.info.push(new GoogleMaps.InfoWindow({
        content: func(location),
      }));
    });
  }

  // This function will get the user's geolocation, and then pass that into the function argument
  withUserLocation(func) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        func({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    } else {
      return false;
    }
  }

  // This function takes an object with a lat and lng value and returns the closest marker from the map.markers array.
  findClosestTo(position) {
    if (position.lat && position.lng) {
      let radius = 6371; // radius of earth in km
      let distance = null;
      let closest = null;

      this.markers.forEach((marker) => {
        let markerLat = marker.position.lat();
        let markerLng = marker.position.lng();
        let distanceLat = rad(markerLat - position.lat);
        let distanceLng = rad(markerLng - position.lng);
        let a = Math.sin(distanceLat/2) * Math.sin(distanceLat/2) + Math.cos(rad(position.lat)) * Math.cos(rad(position.lat)) * Math.sin(distanceLng/2) * Math.sin(distanceLng/2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        let d = radius * c;

        if (distance == null || d < distance) {
          distance = d;
          closest = marker;
        };
      });

      return closest;
    }else {
      console.log('argument needs to be a lat / lng object');
    }
  }
}

GoogleMaps.Load = (key = '') => load(key),
GoogleMaps.Render = (options = {}) => render(options),
GoogleMaps.Controller = (el, options = {}) => {
  if (window.google) {
    return new Controller(el, options);
  }else {
    console.log('A GoogleMaps Controller must be called after GoogleMaps.Load and should be within the Render function');
  }
};

export default GoogleMaps = GoogleMaps;