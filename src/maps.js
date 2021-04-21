import MarkerClusterer from '@googlemaps/markerclustererplus';
import { objectAssign } from 'meteora';

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

    // Here are the defined default settings for the function
    this.settings = objectAssign({
      locations: [],
      markers: true,
      cluster: false,
      clusterSettings: {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
      },
      icon: {
        path: 'M11.672 15.901c-2.734 0-4.952-2.174-4.952-4.857 0-2.682 2.218-4.859 4.952-4.859 2.735 0 4.953 2.177 4.953 4.86 0 2.682-2.218 4.856-4.953 4.856m0-15.9C5.453 0 .411 4.944.411 11.043c0 8.873 11.261 23.73 11.261 23.73s11.26-14.857 11.26-23.73c0-6.1-5.04-11.044-11.26-11.044',
        fillColor: '#ff3366',
        fillOpacity: 1,
        anchor: new GoogleMaps.Point(12,36),
        strokeWeight: 0,
        scale: 1,
      },
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
          location.icon = objectAssign(this.settings.icon, location.icon);
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

  filterMarkers(locations = this.locations) {
    const visible = [];
    let current = [];

    this.markers.forEach((marker) => marker.setMap(null));

    locations.forEach((location) => {
      current = this.markers.filter((marker) => marker.position.lat() == location.position.lat && marker.position.lng() == location.position.lng);
      current.forEach((marker) => visible.push(marker));
    });

    visible.forEach((marker) => marker.setMap(this.map));

    this.updateCluster(visible);
    this.fitBounds(visible);
  }

  showAllMarkers() {
    this.filterMarkers();
  }

  updateCluster(locations = this.markers) {
    if (this.settings.cluster) {
      this.settings.cluster.clearMarkers();
      this.settings.cluster.addMarkers(locations);
    };
  }

  // This function will make it easier to fit all markers in the map
  fitBounds(markers = this.markers) {
    const bounds = new GoogleMaps.LatLngBounds();

    markers.forEach((marker) => bounds.extend(marker.position));

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

  // This function takes an object with a lat and lng value and returns the closest marker from the map.locations array.
  findClosestTo(position, locations = this.locations) {
    if (position.lat && position.lng) {
      let closest = null;
      const radius = 6371; // radius of earth in km
      const calc = {};
      const distance = {
        smallest: null,
        current: null
      };

      locations.forEach((location) => {
        distance.lat = rad(location.position.lat - position.lat);
        distance.lng = rad(location.position.lng - position.lng);
        calc.a = Math.sin(distance.lat/2) * Math.sin(distance.lat/2) + Math.cos(rad(position.lat)) * Math.cos(rad(position.lat)) * Math.sin(distance.lng/2) * Math.sin(distance.lng/2);
        calc.c = 2 * Math.atan2(Math.sqrt(calc.a), Math.sqrt(1-calc.a));
        distance.current = radius * calc.c;

        if (distance.smallest == null || distance.current < distance.smallest) {
          distance.smallest = distance.current;
          closest = location;
        };
      });

      return closest;
    }else {
      console.log('argument needs to be a lat / lng object');
    }
  }

  search(filter = {}) {
    const locations = [];
    let include = true;

    const match = (key1, key2) => {
      return (key1.toString().toLowerCase().indexOf(key2.toString().toLowerCase()) > -1);
    }

    // If we have any filters to look at
    if (Object.keys(filter).length) {
      // Loop each location
      this.locations.forEach((location) => {
        // Set this location up to be included
        include = true;

        // Loop through the filters
        for (let key in filter) {
          // If the location has data related to the filter
          if (location[key]) {
            // Check if the value is an array
            if (Array.isArray(filter[key])) {
              // Loop the filter value array
              for (let i = 0; i < filter[key].length; i++) {
                // If the value doesn't match anything from the location data then dont include it and exit the loop
                // If the data doesnt match, dont include it and exit the loop
                if (!match(location[key], filter[key][i])) {
                  include = false;
                  break;
                };
              }
            }else {
              // If it isnt an array, check that it is in the location data and exit the loop
              if (!match(location[key], filter[key])) include = false;
              break;
            }
          }else {
            // If the location doesnt have any data that matches the filter dont include it and exit the loop
            include = false;
            break;
          }
        }

        // If our location made it to here, then we include it!
        if (include) locations.push(location);
      });

      // Next return our filtered locations
      return (locations.length) ? locations : [];
    }
    // If there was never anything to filter then return everything
    return this.locations;
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