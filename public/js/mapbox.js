/* eslint-disable */
// Using require
export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYmhhdnlhbHV0aHJhMTgiLCJhIjoiY2x2ZXk4dTB1MGMzNjJpcGVtdXdkdzAyYiJ9.eDeSK-Qfy5ozt9WMRxeFQQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/bhavyaluthra18/clveynbb700ni01qzbc79flbb',
    scrollZoom: false
    //center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false
  });
  // bounds object is basically the area that will be display  on the map
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create Marker
    const el = document.createElement('div');
    el.className = 'marker';
    // Add Marker
    // creating new mapbox inside mapboxjs
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom' // bottom of the pin which to be located at exact GPS  location
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add Popup
    new mapboxgl.Popup({
      // because of overlapping
      offset: 30
    })
      .setLngLat(loc.coordinates)
      // days of tours alongg with description
      .setHTML(`<p>Day ${loc.day} : ${loc.description} </p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  //console.log('Map initialized:', map);

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
