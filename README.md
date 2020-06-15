# Google Maps Extension

Import with webpack

```javascript
import GoogleMaps from '../packages/maps/';
```

Or locations will be supplied as an array of data:

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
| clusterIconPath | String | A URL path to a folder containing 5 .png image files [Read more](https://developers.google.com/maps/documentation/javascript/marker-clustering#adding-a-marker-clusterer) |
| icon | Object or String | The Object option uses Google's [SVG path notation](https://developers.google.com/maps/documentation/javascript/symbols#add_to_marker). A String should be a URL to a .png file.|
| map | Object | Here we pass our default map settings, such as the zoom level and the map center. [Read more](https://developers.google.com/maps/documentation/javascript/tutorial#MapOptions) |

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
		fill: '#00785f',
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


## License
[MIT](https://choosealicense.com/licenses/mit/)


