# 🗺️ Google Maps Extension

Add this to your project

```sh
$ yarn add @meteora-digital/google-maps
```

Import with webpack

```javascript
import GoogleMaps from '@meteora-digital/google-maps';
```

Our locations will be supplied as an array of data:

```javascript
const locationArray = [
	{
		title: "Auckland",
		position: {
			lat: -36.8629409,
            lng: 174.7253884,
		},
	},
	{
		title: "Christchurch",
		position: {
			lat: -43.5131101,
            lng: 172.5290382,
		},
	},
	{
		title: "Queenstown",
		position: {
			lat: -45.0244835,
            lng: 168.6743453,
		},
	}
];
```

# Loading the API

```javascript
GoogleMaps.Load('YOUR_API_KEY');
```

Once we have called the load function, we can use the render function to create our new maps.
- The render function waits for the google maps API to load before continuing.

```javascript
GoogleMaps.Render(() => {
	const map = GoogleMaps.Controller(document.querySelector('.js-map'), {
		locations: locationArray,
	});
});
```

# Options

- This package extends the functionality of the [Google Maps API](https://developers.google.com/maps/documentation/javascript/tutorial#MapOptions), therefore anything that works with the default API, should work with this package.
- The helpers created so far are below. 

| Option | Type | Description |
|--------|------|-------------|
| markers | Boolean (default: true) | enables / disables the creation of map markers |
| cluster | Boolean (default: false) | enables / disables map marker clusters |
| clusterSettings | Object | Use this to manipulate the appearance of the clusters [Read more](https://googlemaps.github.io/v3-utility-library/interfaces/_google_markerclustererplus.markerclustereroptions.html) |
| icon | Object or String | The Object option uses Google's [SVG path notation](https://developers.google.com/maps/documentation/javascript/symbols#add_to_marker). A String should be a URL to a .png file.|
| map | Object | Here we pass our default map settings, such as the zoom level and the map center. [Read more](https://developers.google.com/maps/documentation/javascript/tutorial#MapOptions) |

# clusterSettings

While applying styles to the clusterSettings, I have allowed the developer to define one folder URL for the cluster images on the imagePath key, similar to the default, unstyled cluster icons so that we may use 1 icon for each cluster size. 

```javascript

clusterSettings: {
	imagePath: '/themes/mercury/dist/images/maps/m',
	styles: [{
		height: 90,
		width: 90,
		textColor: '#fff',
	}]
}

```

# Additional control

- Different icons can be given to specific locations
- We can run a similar function before the GoogleMaps.Render() function to 

```javascript

const locationArray = [
	{
		title: "Auckland",
		icon: "green",
		position: {
			lat: -36.8629409,
            lng: 174.7253884,
		},
	},
];

const markerTypes = {
	green: {
		fillColor: '#00785f',
	},
}

locationArray.forEach((location) => {
	if (location.icon) location.icon = markerTypes[location.icon];
});
```

Note: These icons are treated the same as the global icon style seen in the options above.

# Methods


```infoTemplate```

return a template used by the InfoWindow of a location.

```javascript
map.infoTemplate((location) => {
	return `<h5>${location.title}</h5>`;
});
```

```filterMarkers```

Show only a filtered selection of markers on the map.

```javascript
map.filterMarkers([locationArray[2], locationArray[0]]);
```

```showAllMarkers```

Shows all the markers. Great after clearing any filters.

```javascript
map.showAllMarkers();
```

```fitBounds```

A shorthand function to fit the map boundaries to an array of markers.

```javascript
map.fitBounds(map.markers);
```

```withUserLocation```

A shorthand function to find the user's location and do something with it.

```javascript
map.withUserLocation((location) => {
  map.fitBounds([map.findClosestTo(location)]);
});
```

```findClosestTo```

A shorthand function to find the closest marker to a lat / lng object coordinates.
Returns the closest marker. By passing in an array of locations, you can find the closest out of the specified locations!

```javascript
  map.findClosestTo(position, locationArray);
```

```search```

A shorthand function to filter the locations based on values in a filters object. The object key/values should match the structure of the locations. Passing {id: 10} will return the location with id = 10 (if this is a key/value).

```javascript
  map.search({id: 10});
```

## License
[MIT](https://choosealicense.com/licenses/mit/)


