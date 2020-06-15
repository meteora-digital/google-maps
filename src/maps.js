import Cluster from '@google/markerclustererplus';
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
			clusterIconPath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
			icon: this.iconDefaults,
			map: {
				disableDefaultUI: false,
				scrollwheel: false,
				zoomControl: true,
				zoom: 10,
			},
		}, options);

		// If we have a center value in the options, use that value, otherwise use the middle of all locations.
		if (this.settings.map.center === undefined) this.settings.map.center = this.findCenter();

		// Create new 
		this.map = new GoogleMaps.Map(this.el, this.settings.map);

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
				icon: location.icon || this.iconDefaults,
			});

			// Add a click handler that opens the infoWindow - if it exists.
			marker.addListener('click', () => {
				if (this.info[index]) this.info[index].open(this.map, marker);
			});

			// We store these markers in an array for filtering later on.
			this.markers.push(marker);
		});

		// this.settings.cluster is a boolean, but not for long
		if (this.settings.cluster) this.settings.cluster = new Cluster(this.map, this.markers, {imagePath: this.settings.clusterIconPath});
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
		this.map.panTo(this.findCenter(locationsArray));

		this.updateCluster(visibleMarkers);
	}

	showAllMarkers() {
        this.markers.forEach((marker) => {
            marker.setMap(this.map);
        });

        this.map.panTo(this.findCenter());

        this.updateCluster(this.markers);
    }

    updateCluster(locations) {
    	if (this.settings.cluster) {
    		this.settings.cluster.clearMarkers();
    		this.settings.cluster.addMarkers(locations);
    	};
    }

    // This function simply finds the average lat and lng so we can place the user in the middle of each of them
	findCenter(locationsArray = this.locations) {
	    const center = {lat: 0, lng: 0};

	    locationsArray.forEach((location) => {
	    	center.lat +=  location.position.lat;
	    	center.lng +=  location.position.lng;
	    });

	    return {
	    	lat: center.lat / locationsArray.length + 1,
	    	lng: center.lng / locationsArray.length + 1,
	    };
	}

	// This function will be used to insert a template for the infoWindows
	infoTemplate(func) {
		this.locations.forEach((location) => {
			this.info.push(new GoogleMaps.InfoWindow({
			    content: func(location),
			}));
		});
	}
}

GoogleMaps.Load = (key) => load(key),
GoogleMaps.Render = (options = {}) => render(options),
GoogleMaps.Controller = (el, options = {}) => {
	if (window.google) {
		return new Controller(el, options);
	}else {
		console.log('A GoogleMaps Controller must be called after GoogleMaps.Load and should be within the Render function');
	}
};

export default GoogleMaps = GoogleMaps;