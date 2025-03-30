'use client';

import 'leaflet/dist/leaflet.css';
import {LatLngExpression} from "leaflet";
import {useEffect, useState} from "react";
import {parseGeoJSONRoutes} from "@/entities/geo-data/convertor";
import {MapView} from "@/features/geo-display/MapView";

const ekb = [56.838011, 60.597474] as LatLngExpression;

async function loadGeoJSON(url: string) {
	const response = await fetch(url);
	const geoJsonData = await response.json();
	return parseGeoJSONRoutes(geoJsonData);
}

const Map = () => {

	const [allRoutes, setAllRoutes] = useState<IRoute[]>([])
	const [showRoutes, setShowRoutes] = useState<IRoute[]>([])

	useEffect(() => {
		const f = async () => {
			const geoJSON = await loadGeoJSON("/test_routes.geo.json");
			setAllRoutes(geoJSON);
			setShowRoutes(geoJSON);
		}
		f()
	}, []);

	useEffect(() => {
		console.log(showRoutes);
	}, [showRoutes]);

	return (
		<div style={{position: "relative"}}>
			<div style={{
				position: "absolute",
				top: 10,
				right: 10,
				background: "white",
				padding: "5px",
				border: "1px solid black",
				zIndex: 1000
			}}>
				<h3>Маршруты</h3>
				{allRoutes.map((route, index) => (
					<button key={index} style={{display: "block", margin: "5px 0"}}
									onClick={() => setShowRoutes([route])}>
						Маршрут {route.name}
					</button>
				))}
				<button style={{display: "block", margin: "5px 0"}}
								onClick={() => setShowRoutes(allRoutes)}>Все маршруты
				</button>
			</div>
			<MapView center={ekb} routes={showRoutes}/>
		</div>);
};

export default Map;