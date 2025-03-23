'use client';

import {MapContainer, Marker, Polyline, Popup, TileLayer} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {CRS, LatLngExpression} from "leaflet";
import {useEffect, useState} from "react";
import {parseGeoJSONRoutes} from "@/app/convertor";

const ekb = [56.838011, 60.597474] as LatLngExpression;

function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

async function loadGeoJSON(url: string) {
	const response = await fetch(url);
	const geoJsonData = await response.json();
	return parseGeoJSONRoutes(geoJsonData);
}

const Map = () => {

	const [routes, setRoutes] = useState<LatLngExpression[][]>([])
	useEffect(() => {
		const f = async () => {
			const geoJSON = await loadGeoJSON("/test_routes.geo.json");
			const arr = [] as LatLngExpression[][]
			geoJSON.map(t => {
				arr.push(t.points)
			})
			setRoutes(arr)
		}
		f()
	}, []);

	useEffect(() => {
		console.log(routes);
	}, [routes]);

	return <MapContainer center={ekb} zoom={13} style={{height: "100vh", width: "100%"}}
											 crs={CRS.EPSG3395}>
		<TileLayer
			url='https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU'
			subdomains={['01', '02', '03', '04']}
			attribution='&copy; <a http="https://yandex.ru" target="_blank">Yandex</a> contributors'
			// onAdd={() => handleTileClick_addYandex()}
			// onRemove={() => handleTileClick_removeYandex()}
		/>
		{routes.map((t, i) =>
			<Polyline key={i} pathOptions={{color: getRandomColor(), weight: 4}} positions={t}/>
		)}
		<Marker position={[56.838011, 60.597474]}>
			<Popup>
				Это центр ЕКБ
			</Popup>
		</Marker>
	</MapContainer>
};

export default Map;